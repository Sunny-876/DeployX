const { spawn } = require('child_process');
const fs = require('fs');
const LOGDIR = 'C:\\Users\\SUNNY\\AppData\\Local\\Temp\\cline\\';
function start(name, cwd, cmd, args, env) {
  const out = fs.openSync(LOGDIR + name + '.log', 'a');
  const p = spawn(cmd, args, { cwd, env: { ...process.env, ...(env || {}) }, detached: true, stdio: ['ignore', out, out] });
  p.unref();
  fs.appendFileSync(LOGDIR + 'deployx-restart.log', name + ' pid=' + p.pid + '\n');
}
start('deployx-api-fresh', 'd:\\DeployX\\apps\\api', 'node', ['dist/main.js']);
start('deployx-agent-fresh', 'd:\\DeployX\\apps\\agent', 'node', ['dist/main.js'], { AGENT_PORT: '4100', DEPLOYX_API_URL: 'http://localhost:4000' });
