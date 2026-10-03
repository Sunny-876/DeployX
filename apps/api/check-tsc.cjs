const { execSync } = require('child_process');
const fs = require('fs');
const LOG = 'C:\\Users\\SUNNY\\AppData\\Local\\Temp\\cline\\deployx-build.log';
const cwd = 'd:\\DeployX\\apps\\api';
let out = '';
function run(cmd, dir) {
  out += '\n$ [' + (dir || cwd) + '] ' + cmd + '\n';
  try {
    out += execSync(cmd, { cwd: dir || cwd, timeout: 180000, encoding: 'utf8', maxBuffer: 1024 * 1024 * 20 });
  } catch (e) {
    out += 'EXIT-FAIL\n' + (e.stdout || '') + '\n' + (e.stderr || '');
  }
}
run('node node_modules\\typescript\\bin\\tsc --noEmit');
run('node node_modules\\typescript\\bin\\tsc --noEmit', 'd:\\DeployX\\apps\\agent');
fs.writeFileSync(LOG, out);
