/**
 * Inventário somente leitura para aceite operacional 11B.3.
 * Não escreve.
 */
import pg from "pg";
import { buildHomolEnv } from "./lib/homol-env.mjs";
import {
  EXPECTED_HOST_HASH,
  EXPECTED_INSTANCE_ID,
  EXPECTED_ORG_SLUG,
  computeInstanceId,
  hostHashFromUrl,
} from "./lib/homol-11b3-migrate-plan.mjs";

if (process.env.DATABASE_ENV?.trim().toLowerCase() !== "preview") {
  console.error(JSON.stringify({ ok: false, reason: "DATABASE_ENV=preview" }));
  process.exit(1);
}

const { env } = buildHomolEnv();
const url = env.POSTGRES_URL || env.RUNTIME_DATABASE_URL;
const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  const identity = await client.query(`
    SELECT current_database() AS database,
           (SELECT system_identifier::text FROM pg_control_system()) AS system_identifier
  `);
  const database = String(identity.rows[0].database);
  const instanceId = computeInstanceId(
    String(identity.rows[0].system_identifier),
    database,
  );
  const hostHash = hostHashFromUrl(url);

  const users = await client.query(`
    SELECT u.id, u.email, u.name, u."isActive",
           coalesce(array_agg(DISTINCT r.code) FILTER (WHERE r.code IS NOT NULL), '{}') AS roles
    FROM "user" u
    LEFT JOIN user_role ur ON ur."userId" = u.id
    LEFT JOIN role r ON r.id = ur."roleId"
    WHERE u."organizationId" = (SELECT id FROM organization WHERE slug = $1 LIMIT 1)
    GROUP BY u.id
    ORDER BY u.email
  `, [EXPECTED_ORG_SLUG]);

  const qaCustomers = await client.query(`
    SELECT id, "legalName", "deletedAt", "createdAt"
    FROM customer
    WHERE "legalName" ILIKE '%[HOMOL-QA-11B3]%'
       OR "tradeName" ILIKE '%[HOMOL-QA-11B3]%'
    ORDER BY "createdAt"
  `);

  const qaEmployees = await client.query(`
    SELECT id, "fullName", "jobTitle", "isActive", "deletedAt", "createdAt"
    FROM employee
    WHERE "fullName" ILIKE '%[HOMOL-QA-11B3]%'
    ORDER BY "createdAt"
  `);

  const qaProposals = await client.query(`
    SELECT id, code, title, status, "createdAt"
    FROM proposal
    WHERE title ILIKE '%[HOMOL-QA-11B3]%'
    ORDER BY "createdAt"
  `);

  const qaOrders = await client.query(`
    SELECT id, code, status, description, "createdAt"
    FROM service_order
    WHERE description ILIKE '%[HOMOL-QA-11B3]%'
       OR code ILIKE '%QA-11B3%'
    ORDER BY "createdAt"
  `);

  const appointments = await client.query(`
    SELECT sa.id, sa.status, sa."startsAt", sa."endsAt", sa."conflictAccepted",
           sa."changeReason", sa."serviceOrderId", sa."employeeId", sa."deletedAt",
           so.code AS os_code, e."fullName" AS employee_name
    FROM service_appointment sa
    LEFT JOIN service_order so ON so.id = sa."serviceOrderId"
    LEFT JOIN employee e ON e.id = sa."employeeId"
    ORDER BY sa."createdAt"
  `);

  const recentAudits = await client.query(`
    SELECT action, "entityType", "entityId", "createdAt"
    FROM audit_log
    WHERE action IN (
      'EMPLOYEE_CREATED','EMPLOYEE_UPDATED',
      'APPOINTMENT_CREATED','APPOINTMENT_RESCHEDULED','APPOINTMENT_CANCELLED',
      'SERVICE_ORDER_STATUS_CHANGED','CUSTOMER_CREATED','PROPOSAL_CREATED',
      'PROPOSAL_STATUS_CHANGED','ENGAGEMENT_CREATED'
    )
    ORDER BY "createdAt" DESC
    LIMIT 30
  `);

  console.log(JSON.stringify({
    ok:
      hostHash === EXPECTED_HOST_HASH &&
      instanceId === EXPECTED_INSTANCE_ID,
    identity: { hostHash, instanceId, organization: EXPECTED_ORG_SLUG },
    users: users.rows.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      isActive: u.isActive,
      roles: u.roles,
    })),
    qa: {
      customers: qaCustomers.rows,
      employees: qaEmployees.rows,
      proposals: qaProposals.rows,
      serviceOrders: qaOrders.rows,
    },
    appointments: appointments.rows,
    recentAudits: recentAudits.rows,
  }, null, 2));
} finally {
  await client.end();
}
