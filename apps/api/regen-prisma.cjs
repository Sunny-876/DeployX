const { execSync } = require('node:child_process');
const fs = require('node:fs');

const clientDir = require('node:path').join(
  'D:\\DeployX\\apps\\api\\node_modules\\.pnpm',
  '@prisma+client@7.10.0_prism_b4b0516d759246a7ca6c6437d993d2f4',
  'node_modules\\.prisma\\client',
);
const target = clientDir + '\\schema.prisma';
const LOG = 'C:\\Users\\SUNNY\\AppData\\Local\\Temp\\cline\\prisma-generate.log';

let out = '';
let ok = false;

// Recreate the generated client from scratch: a fresh directory avoids the
// Windows EBUSY locks that occur when prisma overwrites files in place.
if (process.argv.includes('--clean')) {
  try {
    fs.rmSync(clientDir, { recursive: true, force: true });
    out += 'removed .prisma/client\n';
  } catch (e) {
    out += 'rm dir failed: ' + e.code + '\n';
  }
  try {
    fs.mkdirSync(clientDir, { recursive: true });
    out += 'recreated .prisma/client\n';
  } catch (e) {
    out += 'mkdir failed: ' + e.code + '\n';
  }
}

for (let attempt = 1; attempt <= 8 && !ok; attempt++) {
  out += `\n===== attempt ${attempt} =====\n`;
  try {
    out += execSync('node node_modules\\prisma\\build\\cli.js generate', {
      cwd: 'D:\\DeployX\\apps\\api',
      encoding: 'utf8',
      timeout: 300000,
      maxBuffer: 64 * 1024 * 1024,
    });
    ok = true;
  } catch (e) {
    const text = (e.stdout || '') + '\n' + (e.stderr || '');
    out += 'GENERATE-FAIL\n' + text;
    if (!/EBUSY/.test(text)) break;
    out += '(transient file lock - retrying)\n';
  }
}

out += '\nGENERATE-OK: ' + ok + '\n';

try {
  const dts = fs.readFileSync(clientDir + '\\client.d.ts', 'utf8');
  out += 'client.d.ts has lastSyncedAt: ' + dts.includes('lastSyncedAt') + '\n';
  out += 'client.d.ts has RUNNING: ' + dts.includes("'RUNNING'") + '\n';
} catch (e) {
  out += 'd.ts read failed: ' + e.code + '\n';
}

fs.writeFileSync(LOG, out, 'utf8');
console.log('done ok=' + ok);