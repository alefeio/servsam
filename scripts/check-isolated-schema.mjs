import pg from "pg";

const url =
  process.env.E2E_ISOLATED_DATABASE_URL ||
  "postgresql://servsam:servsam_e2e_local@127.0.0.1:55432/servsam_e2e";

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  const migrations = await client.query(`
    SELECT migration_name, finished_at
    FROM "_prisma_migrations"
    WHERE rolled_back_at IS NULL
    ORDER BY finished_at
  `);
  const tables = await client.query(`
    SELECT
      to_regclass('public.service_order') AS service_order,
      to_regclass('public.employee') AS employee,
      to_regclass('public.service_appointment') AS service_appointment,
      to_regclass('public.billing_request') AS billing_request,
      to_regclass('public.receipt_entry') AS receipt_entry
  `);
  console.log(
    JSON.stringify(
      {
        migrations: migrations.rows.map((row) => row.migration_name),
        serviceOrderPresent: Boolean(tables.rows[0]?.service_order),
        employeePresent: Boolean(tables.rows[0]?.employee),
        appointmentPresent: Boolean(tables.rows[0]?.service_appointment),
        billingRequestPresent: Boolean(tables.rows[0]?.billing_request),
        receiptEntryPresent: Boolean(tables.rows[0]?.receipt_entry),
      },
      null,
      2,
    ),
  );
} finally {
  await client.end();
}
