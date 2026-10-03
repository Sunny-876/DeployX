const { execSync } = require('child_process');
const fs = require('fs');
const out = 'C:\\Users\\SUNNY\\AppData\\Local\\Temp\\cline\\migrate-status.log';
try {
  const r = execSync('node node_modules\\prisma\\build\\cli.js migrate status', {
    cwd: 'd:\\DeployX\\apps\\api',
    timeout: 60000,
    encoding: 'utf8',
  });
  fs.writeFileSync(out, 'OK\n' + r);
} catch (e) {
  fs.writeFileSync(out, 'FAIL\nSTDOUT:\n' + (e.stdout || '') + '\nSTDERR:\n' + (e.stderr || '') + '\nMSG:' + e.message);
}
