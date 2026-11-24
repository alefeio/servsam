/**
 * Smoke somente leitura pós-11B.2: caminhos usados por /sistema (sem criar dados).
 */
import pg from "pg";
import { buildHomolEnv } from "./lib/homol-env.mjs";

const { env } = buildHomolEnv();
const client = new pg.Client({ connectionString: env.RUNTIME_DATABASE_URL });
await client.connect();

try {
  const engagements = await client.query(`
    SELECT e.id, e.code, e.status, count(i.id)::int AS items
    FROM engagement e
    LEFT JOIN engagement_item i ON i."engagementId" = e.id
    WHERE e."deletedAt" IS NULL
    GROUP BY e.id
    ORDER BY e."createdAt" DESC
    LIMIT 3
  `);

  const serviceOrders = await client.query(`
    SELECT id, code, status FROM service_order
    WHERE "deletedAt" IS NULL
    ORDER BY "createdAt" DESC
    LIMIT 5
  `);

  const grants = await client.query(`
    SELECT count(*)::int AS n
    FROM role_permission rp
    JOIN permission p ON p.id = rp."permissionId"
    WHERE p.key IN ('service_order.view', 'service_order.create', 'service_order.update')
  `);

  const loginUsers = await client.query(`
    SELECT count(*)::int AS n FROM "user" WHERE "isActive" = true
  `);

  console.log(
    JSON.stringify(
      {
        phase: "smoke-11b2-homol-read",
        readOnly: true,
        engagementSamples: engagements.rows,
        serviceOrderCount: serviceOrders.rowCount,
        serviceOrderRows: serviceOrders.rows,
        serviceOrderPermissionGrants: grants.rows[0].n,
        activeUsers: loginUsers.rows[0].n,
        schemaQueriesOk: true,
      },
      null,
      2,
    ),
  );
} finally {
  await client.end();
}
