const { spawn, execSync } = require('node:child_process');
const fs = require('node:fs');
const LOG = 'C:\\Users\\SUNNY\\AppData\\Local\\Temp\\cline\\deployx-restart3.log';
try { fs.writeFileSync(LOG, 'restart3 begin ' + new Date().toISOString() + '\n'); } catch {}
function log(s) { fs.appendFileSync(LOG, s + '\n'); }
try {
  execSync('powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 4"', { timeout: 15000 });
} catch {}
function up(port, path) {
  return new Promise((resolve) => {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 4000);
    fetch(`http://localhost:${port}${path}`, { signal: c.signal }).then(async (r) => {
      clearTimeout(t);
      resolve(`${port}${path} UP ${r.status}`);
    }).catch((e) => { clearTimeout(t); resolve(`${port}${path} DOWN ${String((e && e.message) || e)}`); });
  });
}
(async () => {
  log(await up(4000, '/health'));
  log(await up(4100, '/health'));
  function start(name, cwd, args, env) {
    const out = fs.openSync('C:\\Users\\SUNNY\\AppData\\Local\\Temp\\cline\\' + name + '.log', 'a');
    const p = spawn('node', args, { cwd, env: { ...process.env, ...(env || {}) }, detached: true, stdio: ['ignore', out, out] });
    p.unref();
    log(name + ' pid=' + p.pid);
  }
  const apiUp = fs.readFileSync(LOG, 'utf8').includes('4000/health UP');
  const agentUp = fs.readFileSync(LOG, 'utf8').includes('4100/health UP');
  if (!apiUp) start('deployx-api-new', 'd:\\DeployX\\apps\\api', ['dist/main.js']);
  if (!agentUp) start('deployx-agent-new', 'd:\\DeployX\\apps\\agent', ['dist/main.js'], { AGENT_PORT: '4100', DEPLOYX_API_URL: 'http://localhost:4000' });
  log('done');
})();
