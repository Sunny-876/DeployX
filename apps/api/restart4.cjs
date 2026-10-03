const { spawn, execSync } = require('node:child_process');
const fs = require('node:fs');
const LOG = 'C:\\Users\\SUNNY\\AppData\\Local\\Temp\\cline\\deployx-restart4.log';
try { fs.writeFileSync(LOG, 'restart4 begin ' + new Date().toISOString() + '\n'); } catch {}
function log(s) { fs.appendFileSync(LOG, s + '\n'); }
try {
  execSync('powershell -NoProfile -ExecutionPolicy Bypass -Command "$cs=Get-NetTCPConnection -LocalPort 4000 -State Listen -ErrorAction SilentlyContinue; foreach($c in $cs){ try{ Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue }catch{} }"', { timeout: 20000 });
  log('killed 4000');
} catch (e) { log('kill fail ' + e.message); }
try { execSync('powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 3"', { timeout: 15000 }); } catch {}
function start(name, cwd, args, env) {
  const out = fs.openSync('C:\\Users\\SUNNY\\AppData\\Local\\Temp\\cline\\' + name + '.log', 'a');
  const p = spawn('node', args, { cwd, env: { ...process.env, ...(env || {}) }, detached: true, stdio: ['ignore', out, out] });
  p.unref();
  log(name + ' pid=' + p.pid);
}
start('deployx-api-new', 'd:\\DeployX\\apps\\api', ['dist/main.js']);
log('done');
