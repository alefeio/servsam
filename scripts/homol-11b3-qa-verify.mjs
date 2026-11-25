/**
 * Verificação somente leitura do cenário [HOMOL-QA-11B3].
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";
import { buildHomolEnv } from "./lib/homol-env.mjs";

if (process.env.DATABASE_ENV?.trim().toLowerCase() !== "preview") {
  console.error(JSON.stringify({ ok: false, reason: "DATABASE_ENV=preview" }));
  process.exit(1);
}

const run = JSON.parse(
  readFileSync(
    resolve("docs/architecture/v1/artifacts-11b3-operational/run-result.json"),
    "utf8",
  ),
);
const { env } = buildHomolEnv();
const client = new pg.Client({
  connectionString: env.POSTGRES_URL || env.RUNTIME_DATABASE_URL,
});
await client.connect();
try {
  const os = await client.query(
    `SELECT id, code, status, description FROM service_order WHERE id = $1`,
    [run.ids.serviceOrderId],
  );
  const appointments = await client.query(
    `SELECT id, status, "startsAt", "endsAt", "changeReason", "conflictAccepted", "createdAt", "cancelledAt"
     FROM service_appointment
     WHERE "serviceOrderId" = $1
     ORDER BY "createdAt"`,
    [run.ids.serviceOrderId],
  );
  const employee = await client.query(
    `SELECT id, "fullName", "jobTitle", "isActive" FROM employee WHERE id = $1`,
    [run.ids.employeeId],
  );
  const customer = await client.query(
    `SELECT id, "legalName" FROM customer WHERE id = $1`,
    [run.ids.customerId],
  );
  const audits = await client.query(
    `SELECT action, "entityType", "entityId", "createdAt"
     FROM audit_log
     WHERE "entityId" = ANY($1::text[])
        OR (action LIKE 'APPOINTMENT%' AND "entityId" = ANY(
          SELECT id FROM service_appointment WHERE "serviceOrderId" = $2
        ))
     ORDER BY "createdAt"`,
    [
      [
        run.ids.customerId,
        run.ids.proposalId,
        run.ids.engagementId,
        run.ids.serviceOrderId,
        run.ids.employeeId,
      ],
      run.ids.serviceOrderId,
    ],
  );
  const grantsAdmin = await client.query(`
    SELECT p.key
    FROM role r
    JOIN role_permission rp ON rp."roleId" = r.id
    JOIN permission p ON p.id = rp."permissionId"
    WHERE r.code = 'ADMINISTRATIVO' AND p.key = 'employee.manage'
  `);
  const financePayments = await client.query(`
    SELECT to_regclass('public.payment') AS payment,
           to_regclass('public.invoice') AS invoice,
           to_regclass('public.finance_entry') AS finance_entry
  `);

  const activeAppts = appointments.rows.filter((r) => r.status === "scheduled");
  console.log(
    JSON.stringify(
      {
        ok:
          os.rows[0]?.status === "cancelled" &&
          employee.rows[0]?.isActive === false &&
          activeAppts.length === 0 &&
          appointments.rows.length >= 2 &&
          grantsAdmin.rows.length === 0,
        customer: customer.rows[0],
        employee: employee.rows[0],
        serviceOrder: os.rows[0],
        appointments: appointments.rows,
        activeAppointments: activeAppts.length,
        audits: audits.rows,
        adminStillMissingEmployeeManage: grantsAdmin.rows.length === 0,
        financeTables: financePayments.rows[0],
      },
      null,
      2,
    ),
  );
} finally {
  await client.end();
}
