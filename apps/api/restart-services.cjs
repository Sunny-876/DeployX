const fs = require('fs');
const LOG = 'C:\\Users\\SUNNY\\AppData\\Local\\Temp\\cline\\deployx-restart.log';
const { spawn } = require('child_process');
function log(s) { fs.appendFileSync(LOG, s + '\n'); try { console.log(s); } catch {} }
try { fs.writeFileSync(LOG, 'restart begin ' + new Date().toISOString() + '\n'); } catch {}
// Kill processes listening on 4000/4100 so fresh code can bind.
const killer = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command',
`$err=0;
foreach($p in @(4000,4100)){
  $conns = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue;
  foreach($c in $conns){ try{ Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue; }catch{} }
}
Start-Sleep -Seconds 2;
'KILLED'`], { detached: true, stdio: 'ignore' });
killer.unref();
log('kill signal sent');
