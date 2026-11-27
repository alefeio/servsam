/**
 * Verificação SOMENTE LEITURA pós RELEASE-01 no HOMOL.
 */
import pg from "pg";
import { writeFileSync } from "node:fs";
import { buildHomolEnv } from "./lib/homol-env.mjs";
import {
  EXPECTED_HOST_HASH,
  EXPECTED_INSTANCE_ID,
  computeInstanceId,
  listLocalMigrationNames,
  defaultMigrationsDir,
  classifyMigrationHistory,
} from "./lib/homol-11b4-migrate-plan.mjs";

if (process.env.DATABASE_ENV?.trim().toLowerCase() !== "preview") {
  console.error(JSON.stringify({ ok: false, reason: "DATABASE_ENV=preview" }));
  process.exit(1);
}

const PREFIX = "[HOMOL-QA-11B4]";
const { env, targetHostHash } = buildHomolEnv();
const url = env.POSTGRES_URL || env.RUNTIME_DATABASE_URL;
const client = new pg.Client({ connectionString: url });
await client.connect();

try {
  const id = await client.query(`
    SELECT current_database() AS database,
           (SELECT system_identifier::text FROM pg_control_system()) AS sid
  `);
  const database = String(id.rows[0].database);
  const instanceId = computeInstanceId(String(id.rows[0].sid), database);
  const migrations = await client.query(`
    SELECT migration_name, finished_at, rolled_back_at
    FROM "_prisma_migrations"
    ORDER BY finished_at ASC NULLS LAST, migration_name ASC
  `);
  const local = listLocalMigrationNames(defaultMigrationsDir());
  const history = classifyMigrationHistory(migrations.rows, local);

  const counts = await client.query(`
    SELECT
      (SELECT count(*)::int FROM customer) AS customers_total,
      (SELECT count(*)::int FROM customer WHERE "deletedAt" IS NULL) AS customers_active,
      (SELECT count(*)::int FROM customer WHERE "deletedAt" IS NOT NULL) AS customers_archived,
      (SELECT count(*)::int FROM proposal WHERE "deletedAt" IS NULL) AS proposals_active,
      (SELECT count(*)::int FROM engagement WHERE "deletedAt" IS NULL) AS engagements_active,
      (SELECT count(*)::int FROM received_purchase_order WHERE "deletedAt" IS NULL) AS purchase_orders_active,
      (SELECT count(*)::int FROM service_order WHERE "deletedAt" IS NULL) AS service_orders_active,
      (SELECT count(*)::int FROM employee WHERE "deletedAt" IS NULL) AS employees_active,
      (SELECT count(*)::int FROM service_appointment WHERE "deletedAt" IS NULL) AS appointments_active,
      (SELECT count(*)::int FROM "user") AS users_total,
      (SELECT count(*)::int FROM audit_log) AS audit_logs_total,
      (SELECT count(*)::int FROM billing_request) AS billing_requests,
      (SELECT count(*)::int FROM receipt_entry) AS receipt_entries,
      (SELECT count(*)::int FROM receipt_entry WHERE status='confirmed') AS receipts_confirmed_active
  `);

  const customers = await client.query(
    `SELECT id, "legalName", "deletedAt" FROM customer WHERE "legalName" LIKE $1 ORDER BY "createdAt"`,
    [`${PREFIX}%`],
  );
  const proposals = await client.query(
    `SELECT id, title, status, "totalCents", "customerId" FROM proposal WHERE title LIKE $1 AND "deletedAt" IS NULL`,
    [`${PREFIX}%`],
  );
  const engagements = await client.query(
    `SELECT id, code, title, "totalCents", status, "customerId", "proposalId"
     FROM engagement WHERE (title LIKE $1 OR code IN (
       SELECT e.code FROM engagement e
       JOIN proposal p ON p.id = e."proposalId"
       WHERE p.title LIKE $1
     )) AND "deletedAt" IS NULL`,
    [`${PREFIX}%`],
  );

  const engagementIds = engagements.rows.map((r) => r.id);
  let billing = { rows: [] };
  let receipts = { rows: [] };
  let audits = { rows: [] };
  if (engagementIds.length) {
    billing = await client.query(
      `SELECT id, status, description, notes, "referenceAmountCents",
              "invoiceIssuedExternally", "externalDocumentRef",
              "requestedById", "processedById", "processedAt", "requestedAt"
       FROM billing_request
       WHERE "engagementId"::text = ANY($1::text[]) AND "deletedAt" IS NULL
       ORDER BY "requestedAt"`,
      [engagementIds.map(String)],
    );
    receipts = await client.query(
      `SELECT id, status, kind, "amountCents", "requestedAmountCents",
              "confirmedManually", "confirmedById", "confirmedAt",
              "reversedById", "reversedAt", "reversalReason", notes,
              "requestedById", "requestedAt"
       FROM receipt_entry
       WHERE "engagementId"::text = ANY($1::text[]) AND "deletedAt" IS NULL
       ORDER BY "requestedAt"`,
      [engagementIds.map(String)],
    );
    const entityIds = [
      ...engagementIds,
      ...customers.rows.map((r) => r.id),
      ...proposals.rows.map((r) => r.id),
      ...billing.rows.map((r) => r.id),
      ...receipts.rows.map((r) => r.id),
    ].map(String);
    audits = await client.query(
      `SELECT action, "entityType", "entityId", "createdAt"
       FROM audit_log
       WHERE "entityId" = ANY($1::text[])
       ORDER BY "createdAt"`,
      [entityIds],
    );
  }

  const users = await client.query(`
    SELECT u.id, split_part(u.email,'@',2) AS "emailDomain", u.name, u."isActive",
           coalesce(array_agg(DISTINCT r.code) FILTER (WHERE r.code IS NOT NULL), '{}') AS roles
    FROM "user" u
    LEFT JOIN user_role ur ON ur."userId" = u.id
    LEFT JOIN role r ON r.id = ur."roleId"
    GROUP BY u.id
    ORDER BY u."createdAt"
  `);

  const eng = engagements.rows[0];
  const receipt = receipts.rows[0];
  const bill = billing.rows[0];
  const confirmedNet = receipts.rows
    .filter((r) => r.status === "confirmed")
    .reduce((s, r) => s + Number(r.amountCents), 0);
  const referenceBalance = eng
    ? Number(eng.totalCents) - confirmedNet
    : null;

  const checks = {
    identityOk:
      targetHostHash === EXPECTED_HOST_HASH &&
      instanceId === EXPECTED_INSTANCE_ID,
    migrationsUnchanged: history.pending.length === 0 && history.failed.length === 0 && history.applied.length === 8,
    usersUnchanged: users.rows.length === 2,
    oneCustomer: customers.rows.length === 1,
    oneProposal: proposals.rows.length === 1,
    oneEngagement: engagements.rows.length === 1,
    engagementTotal100000: eng ? Number(eng.totalCents) === 100_000 : false,
    billingProcessed: bill?.status === "processed",
    billingNoRealInvoice: bill ? bill.invoiceIssuedExternally === false : false,
    receiptReversed: receipt?.status === "reversed",
    requestedAmount40000: receipt ? Number(receipt.requestedAmountCents) === 40_000 : false,
    confirmedAmountPreserved25000: receipt ? Number(receipt.amountCents) === 25_000 : false,
    confirmedManuallyTrue: receipt?.confirmedManually === true,
    noActiveConfirmed: Number(counts.rows[0].receipts_confirmed_active) === 0,
    referenceBalance100000: referenceBalance === 100_000,
    onlyOneReceipt: receipts.rows.length === 1,
    onlyOneBilling: billing.rows.length === 1,
  };

  const report = {
    ok: Object.values(checks).every(Boolean),
    phase: "release-01-verify-ro",
    readOnly: true,
    capturedAt: new Date().toISOString(),
    identity: {
      hostHash: targetHostHash,
      hostHashMatches: targetHostHash === EXPECTED_HOST_HASH,
      database,
      instanceId,
      instanceIdMatches: instanceId === EXPECTED_INSTANCE_ID,
    },
    migrations: {
      total: history.applied.length,
      pending: history.pending,
      failed: history.failed,
      allFinished: history.pending.length === 0 && history.failed.length === 0,
    },
    counts: counts.rows[0],
    users: users.rows.map((u) => ({
      id: u.id,
      emailDomain: u.emailDomain,
      name: u.name,
      isActive: u.isActive,
      roles: u.roles,
    })),
    scenario: {
      customers: customers.rows,
      proposals: proposals.rows,
      engagements: engagements.rows,
      billing: billing.rows,
      receipts: receipts.rows,
      confirmedNetCents: confirmedNet,
      referenceBalanceCents: referenceBalance,
      auditActions: audits.rows.map((a) => a.action),
    },
    checks,
  };

  writeFileSync(
    "docs/architecture/v1/release-01-inventory-after.json",
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 2;
} finally {
  await client.end();
}
