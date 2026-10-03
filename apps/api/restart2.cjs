const { spawn } = require('node:child_process');
const fs = require('node:fs');
const LOG = 'C:\\Users\\SUNNY\\AppData\\Local\\Temp\\cline\\deployx-restart2.log';
function log(s) { fs.appendFileSync(LOG, s + '\n'); }
try { fs.writeFileSync(LOG, 'restart2 begin ' + new Date().toISOString() + '\n'); } catch {}
function psList() {
  const { execSync } = require('node:child_process');
  try {
    return execSync('powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort 4000,4100 -State Listen | Select-Object LocalPort,OwningProcess | Format-Table -AutoSize | Out-String"', { timeout: 15000, encoding: 'utf8' });
  } catch (e) { return 'PSLIST_FAIL ' + e.message; }
}
log('BEFORE:\n' + psList());
function killPort(port) {
  const { execSync } = require('node:child_process');
  try {
    execSync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "$cs=Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue; foreach($c in $cs){ try{ Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue }catch{} }"`, { timeout: 20000 });
    log('killed ' + port);
  } catch (e) { log('kill ' + port + ' fail ' + e.message); }
}
killPort(4000);
killPort(4100);
const { execSync } = require('node:child_process');
try { execSync('powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 3"', { timeout: 15000 }); } catch {}
log('AFTER:\n' + psList());
function start(name, cwd, args, env) {
  const out = fs.openSync('C:\\Users\\SUNNY\\AppData\\Local\\Temp\\cline\\' + name + '.log', 'a');
  const p = spawn('node', args, { cwd, env: { ...process.env, ...(env || {}) }, detached: true, stdio: ['ignore', out, out] });
  p.unref();
  log(name + ' pid=' + p.pid);
}
start('deployx-api-new', 'd:\\DeployX\\apps\\api', ['dist/main.js']);
start('deployx-agent-new', 'd:\\DeployX\\apps\\agent', ['dist/main.js'], { AGENT_PORT: '4100', DEPLOYX_API_URL: 'http://localhost:4000' });
