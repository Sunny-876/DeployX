const { execSync } = require('node:child_process');
const fs = require('node:fs');
function run(cmd, cwd) {
  return execSync(cmd, { cwd: cwd || 'd:\\DeployX\\apps\\api', timeout: 180000, encoding: 'utf8', maxBuffer: 1024 * 1024 * 30 }).slice(0, 3000);
}
let out = '';
try {
  out += run('node node_modules\\@nestjs\\cli\\bin\\nest.js build') + '\nBUILD_OK\n';
} catch (e) { out += 'BUILD_FAIL ' + ((e.stdout || '') + (e.stderr || '')).slice(0, 3000); }
fs.writeFileSync('C:\\Users\\SUNNY\\AppData\\Local\\Temp\\cline\\deployx-build2.log', out);
