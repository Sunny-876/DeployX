const { execSync } = require('node:child_process');
const fs = require('node:fs');

const LOG = 'C:\\Users\\SUNNY\\AppData\\Local\\Temp\\cline\\svc-control.log';
const ports = process.argv.slice(2).filter((a) => /^\d+$/.test(a)).map(Number);

let out = '';

function run(cmd) {
  out += `\n$ ${cmd}\n`;
  try {
    out += execSync(cmd, { timeout: 120000, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  } catch (e) {
    out += 'EXIT-FAIL ' + (e.status || '') + '\n' + (e.stdout || '') + '\n' + (e.stderr || '') + '\n';
  }
}

// Kill any nest watch/build processes so nothing restarts the services.
try {
  const procs = execSync(
    'powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \\"Name=\'node.exe\'\\" | Where-Object { $_.CommandLine -like \'*nest*\' } | ForEach-Object { $_.ProcessId }"',
    { encoding: 'utf8', shell: 'cmd.exe', timeout: 60000 },
  );
  const nestPids = procs.split(/\s+/).filter((p) => /^\d+$/.test(p));
  out += `nest pids: ${nestPids.join(', ') || 'none'}\n`;
  for (const pid of nestPids) run(`taskkill /pid ${pid} /T /F`);
} catch (e) {
  out += 'nest-scan-failed: ' + ((e && e.message) || e) + '\n';
}

if (ports.length > 0) {
  const netstat = execSync('netstat -ano -p tcp', { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const pids = new Set();
  for (const line of netstat.split(/\r?\n/)) {
    const m = line.match(/^\s*TCP\s+\S+:(\d+)\s+\S+\s+LISTENING\s+(\d+)\s*$/i);
    if (!m) continue;
    if (!ports.includes(Number(m[1]))) continue;
    pids.add(Number(m[2]));
  }
  out += `pids listening on ${ports.join(',')}: ${[...pids].join(', ') || 'none'}\n`;
  for (const pid of pids) {
    run(`taskkill /pid ${pid} /T /F`);
  }
  run(`netstat -ano -p tcp | findstr ":${ports.join(' :')}"`);
}

fs.writeFileSync(LOG, out, 'utf8');
console.log('done');