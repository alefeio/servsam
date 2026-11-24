import pg from "pg";

const url =
  process.env.E2E_ISOLATED_DATABASE_URL ||
  "postgresql://servsam:servsam_e2e_local@127.0.0.1:55432/servsam_e2e";

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  const activity = await client.query(`
    SELECT pid, state, wait_event_type, left(query, 120) AS query
    FROM pg_stat_activity
    WHERE datname = current_database()
    ORDER BY pid
  `);
  console.log(JSON.stringify({ activity: activity.rows }, null, 2));

  const locks = await client.query(`
    SELECT l.pid, l.locktype, l.mode, l.granted, l.objid
    FROM pg_locks l
    WHERE l.objid = 72707369 OR l.locktype = 'advisory'
  `);
  console.log(JSON.stringify({ locks: locks.rows }, null, 2));

  for (const row of locks.rows) {
    if (row.pid && row.pid !== (await client.query("SELECT pg_backend_pid() AS pid")).rows[0].pid) {
      await client.query("SELECT pg_terminate_backend($1)", [row.pid]);
      console.log(JSON.stringify({ terminated: row.pid }));
    }
  }
} finally {
  await client.end();
}
