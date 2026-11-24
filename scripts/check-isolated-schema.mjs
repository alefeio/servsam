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
  const table = await client.query(
    `SELECT to_regclass('public.service_order') AS reg`,
  );
  console.log(
    JSON.stringify(
      {
        migrations: migrations.rows.map((row) => row.migration_name),
        serviceOrderPresent: Boolean(table.rows[0]?.reg),
      },
      null,
      2,
    ),
  );
} finally {
  await client.end();
}
