const { execSync } = require('node:child_process');
const fs = require('node:fs');
const LOG = 'C:\\Users\\SUNNY\\AppData\\Local\\Temp\\cline\\docker-inspect2.log';
let out = '';
function run(cmd) {
  out += '\n$ ' + cmd + '\n';
  try {
    out += execSync(cmd, { timeout: 60000, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  } catch (e) {
    out += 'EXIT-FAIL ' + (e.status || '') + '\n' + (e.stdout || '') + '\n' + (e.stderr || '') + '\n';
  }
}
for (const ctx of ['default', 'desktop-linux']) {
  run(`docker --context ${ctx} ps -a --no-trunc --format "{{.ID}}::{{.Names}}::{{.Image}}::{{.Status}}::{{.Ports}}"`);
  run(`docker --context ${ctx} ps -a --format "{{.Names}}"`);
}
try {
  const names = execSync('docker --context default ps -a --format "{{.Names}}"', { encoding: 'utf8' })
    .split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  for (const n of names) {
    out += '\n--- inspect(default) ' + n + ' ---\n';
    try {
      const raw = execSync(`docker --context default inspect ${n}`, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
      const arr = JSON.parse(raw);
      for (const c of arr) {
        out += 'Name=' + c.Name + ' State=' + c.State.Status + ' Running=' + c.State.Running + ' Paused=' + c.State.Paused + '\n';
        out += 'Labels=' + JSON.stringify(c.Config.Labels) + '\n';
        out += 'Env=' + JSON.stringify((c.Config.Env || []).filter((e) => /DEPLOYX|PROJECT|PORT/i.test(e))) + '\n';
        out += 'Ports=' + JSON.stringify(c.NetworkSettings.Ports) + '\n';
        out += 'Created=' + c.Created + '\n';
      }
    } catch (e) {
      out += 'INSPECT-FAIL ' + ((e && e.message) || e) + '\n';
    }
  }
} catch (e) {
  out += 'LIST-FAIL ' + ((e && e.message) || e) + '\n';
}
fs.writeFileSync(LOG, out, 'utf8');
console.log('done');
