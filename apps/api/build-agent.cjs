const { execSync } = require('node:child_process');
const fs = require('node:fs');
let out = '';
function run(cmd, cwd) {
  try { out += execSync(cmd, { cwd, timeout: 180000, encoding: 'utf8', maxBuffer: 1024 * 1024 * 30 }).slice(0, 2000); out += '\nOK:' + cmd + '\n'; }
  catch (e) { out += '\nFAIL:' + cmd + '\n' + ((e.stdout || '') + (e.stderr || '')).slice(0, 3000); }
}
run('node node_modules\\@nestjs\\cli\\bin\\nest.js build', 'd:\\DeployX\\apps\\agent');
fs.writeFileSync('C:\\Users\\SUNNY\\AppData\\Local\\Temp\\cline\\deployx-build-agent.log', out);
