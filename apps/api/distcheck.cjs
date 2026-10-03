const { execSync } = require('child_process');
const fs = require('fs');
const LOG = 'C:\\Users\\SUNNY\\AppData\\Local\\Temp\\cline\\deployx-distcheck.log';
let out = '';
function ls(p) {
  try { out += '\n## ' + p + '\n' + execSync('cmd /c dir "' + p + '" /b', { timeout: 15000, encoding: 'utf8' }); }
  catch (e) { out += '\n## ' + p + ' ERR ' + e.message + '\n'; }
}
ls('d:\\DeployX\\apps\\api\\dist\\agents');
ls('d:\\DeployX\\apps\\agent\\dist\\pairing');
try { out += '\nAPI_MODULE:\n' + fs.readFileSync('d:\\DeployX\\apps\\api\\dist\\app.module.js', 'utf8').slice(0, 1500); } catch (e) { out += 'API_MODULE_ERR ' + e.message; }
fs.writeFileSync(LOG, out);
