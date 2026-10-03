const { execSync } = require('node:child_process');
const fs = require('node:fs');
const LOG = 'C:\\Users\\SUNNY\\AppData\\Local\\Temp\\cline\\db-dump.log';
const sql = [
  'SELECT id, email, name FROM "User" ORDER BY "createdAt";',
  'SELECT id, name, slug, framework, "userId", "createdAt" FROM "Project" ORDER BY "createdAt";',
  'SELECT id, "projectId", "agentId", status, url, "commitHash", "createdAt" FROM "Deployment" ORDER BY "createdAt";',
  'SELECT id, name, status, "userId", "hostname", "lastSeenAt", "revokedAt" FROM "Agent" ORDER BY "createdAt";',
  'SELECT count(*) AS users FROM "User";',
  'SELECT count(*) AS projects FROM "Project";',
  'SELECT count(*) AS deployments FROM "Deployment";',
].join(' ');
let out = '';
try {
  out = execSync(
    `docker exec deployx-postgres psql -U deployx -d deployx -A -F " | " -c "${sql.replace(/"/g, '\\"')}"`,
    { encoding: 'utf8', timeout: 60000, maxBuffer: 64 * 1024 * 1024 },
  );
} catch (e) {
  out = 'FAIL ' + ((e && e.message) || e) + '\n' + (e.stdout || '') + '\n' + (e.stderr || '');
}
fs.writeFileSync(LOG, out, 'utf8');
console.log('done');
