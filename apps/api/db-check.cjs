const { Client } = require('pg');
const fs = require('fs');
const LOG = 'C:\\Users\\SUNNY\\AppData\\Local\\Temp\\cline\\deployx-db.log';
(async () => {
  const c = new Client({ connectionString: 'postgresql://deployx:deployx_password@localhost:5432/deployx' });
  let out = '';
  try {
    await c.connect();
    const t = await c.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY 1");
    out += 'TABLES:' + t.rows.map((r) => r.tablename).join(',') + '\n';
    for (const tbl of ['Agent', 'AgentPairing', 'Deployment', 'User']) {
      try {
        const cols = await c.query('SELECT column_name FROM information_schema.columns WHERE table_name=$1 ORDER BY 1', [tbl]);
        out += tbl + '_COLS:' + cols.rows.map((r) => r.column_name).join(',') + '\n';
      } catch (e) { out += tbl + '_ERR:' + e.message + '\n'; }
    }
    try {
      const u = await c.query('SELECT id,email FROM "User" ORDER BY "createdAt" LIMIT 10');
      out += 'USERS:' + JSON.stringify(u.rows) + '\n';
    } catch (e) { out += 'USERS_ERR:' + e.message + '\n'; }
  } catch (e) { out += 'CONNECT_ERR:' + e.message + '\n'; }
  finally { try { await c.end(); } catch {} }
  fs.writeFileSync(LOG, out);
})();
