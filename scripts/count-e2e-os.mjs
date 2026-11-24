import pg from "pg";

const url =
  process.env.E2E_ISOLATED_DATABASE_URL ||
  "postgresql://servsam:servsam_e2e_local@127.0.0.1:55432/servsam_e2e";
const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  const os = await client.query(
    `SELECT count(*)::int AS n FROM service_order WHERE description ILIKE '%E2E%'`,
  );
  const customers = await client.query(
    `SELECT count(*)::int AS n FROM customer WHERE "legalName" ILIKE '%[E2E]%OS%'`,
  );
  console.log(
    JSON.stringify({
      serviceOrdersE2e: os.rows[0].n,
      customersOsE2e: customers.rows[0].n,
    }),
  );
} finally {
  await client.end();
}
