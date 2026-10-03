const { execSync } = require('child_process');
const fs = require('fs');
const LOG = 'C:\\Users\\SUNNY\\AppData\\Local\\Temp\\cline\\deployx-rebuild.log';
const cwd = 'd:\\DeployX\\apps\\api';
let out = '';
function run(cmd, dir) {
  out += '\n$ [' + (dir || cwd) + '] ' + cmd + '\n';
  try {
    out += execSync(cmd, { cwd: dir || cwd, timeout: 180000, encoding: 'utf8', maxBuffer: 1024 * 1024 * 20 });
  } catch (e) {
    out += 'EXIT-FAIL\n' + ((e.stdout || '') + '\n' + (e.stderr || '')).slice(0, 4000);
  }
}
run('node node_modules\\@nestjs\\cli\\bin\\nest.js build');
run('node node_modules\\typescript\\bin\\tsc --noEmit -p tsconfig.json', 'd:\\DeployX\\apps\\agent');
run('node node_modules\\next\\dist\\bin\\next lint --file src/components/AgentCard.tsx src/components/useAgents.ts src/components/Navigation.tsx', 'd:\\DeployX\\apps\\dashboard');
fs.writeFileSync(LOG, out);
