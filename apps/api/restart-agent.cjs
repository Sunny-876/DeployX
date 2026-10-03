const { execSync, spawn } = require('node:child_process');
const fs = require('node:fs');
const LOG = 'C:\\Users\\SUNNY\\AppData\\Local\\Temp\\cline\\deployx-restart-agent.log';
try { fs.writeFileSync(LOG, 'restart-agent begin ' + new Date().toISOString() + '\n'); } catch {}
function log(s) { fs.appendFileSync(LOG, s + '\n'); }
try {
  execSync('powershell -NoProfile -ExecutionPolicy Bypass -Command "$cs=Get-NetTCPConnection -LocalPort 4100 -State Listen -ErrorAction SilentlyContinue; foreach($c in $cs){ try{ Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue }catch{} }"', { timeout: 20000 });
  log('killed 4100');
} catch (e) { log('kill fail ' + e.message); }
try { execSync('powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 3"', { timeout: 15000 }); } catch {}
const out = fs.openSync('C:\\Users\\SUNNY\\AppData\\Local\\Temp\\cline\\deployx-agent-new.log', 'a');
const p = spawn('node', ['dist/main.js'], { cwd: 'd:\\DeployX\\apps\\agent', env: { ...process.env, AGENT_PORT: '4100', DEPLOYX_API_URL: 'http://localhost:4000' }, detached: true, stdio: ['ignore', out, out] });
p.unref();
log('agent pid=' + p.pid);
