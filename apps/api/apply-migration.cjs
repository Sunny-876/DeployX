const { execSync } = require('child_process');
const fs = require('fs');
const LOG = 'C:\\Users\\SUNNY\\AppData\\Local\\Temp\\cline\\deployx-migrate.log';
const cwd = 'd:\\DeployX\\apps\\api';
let out = '';
function run(cmd) {
  out += '\n$ ' + cmd + '\n';
  try {
    out += execSync(cmd, { cwd, timeout: 120000, encoding: 'utf8' });
  } catch (e) {
    out += 'EXIT-FAIL\n' + (e.stdout || '') + '\n' + (e.stderr || '');
  }
}
run('node node_modules\\prisma\\build\\cli.js migrate deploy');
run('node node_modules\\prisma\\build\\cli.js generate');
fs.writeFileSync(LOG, out);
