const { execSync } = require('child_process');
const fs = require('fs');
const LOG = 'C:\\Users\\SUNNY\\AppData\\Local\\Temp\\cline\\deployx-check.log';
const cwd = 'd:\\DeployX\\apps\\api';
function probe(url, opts, ms) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms || 8000);
  return fetch(url, { ...(opts || {}), signal: c.signal })
    .then(async (r) => ({ status: r.status, body: await r.text().catch(() => '') }))
    .catch((e) => ({ status: -1, body: String(e && e.message || e) }))
    .finally(() => clearTimeout(t));
}
(async () => {
  let out = '';
  out += 'API health: ' + JSON.stringify(await probe('http://localhost:4000/health')) + '\n';
  out += 'Agent health: ' + JSON.stringify(await probe('http://localhost:4100/health')) + '\n';
  out += 'Agent status: ' + JSON.stringify(await probe('http://localhost:4100/agent/status')) + '\n';
  fs.writeFileSync(LOG, out);
})();
