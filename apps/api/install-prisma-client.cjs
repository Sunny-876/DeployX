const fs = require('node:fs');
const path = require('node:path');

const LOG = 'C:\\Users\\SUNNY\\AppData\\Local\\Temp\\cline\\prisma-copy.log';
const src = 'D:\\DeployX\\apps\\api\\generated\\prisma';

const clientPkg = require.resolve('@prisma\\client\\package.json', {
  paths: ['D:\\DeployX\\apps\\api'],
});
const clientDir = path.dirname(clientPkg);
const target = path.join(clientDir, 'node_modules', '.prisma', 'client');

let out = '';
out += '@prisma/client dir: ' + clientDir + '\n';
out += 'index.js head: ' + fs.readFileSync(path.join(clientDir, 'index.js'), 'utf8').split('\n').slice(0, 3).join(' | ') + '\n';
out += 'target: ' + target + '\n';
out += 'src exists: ' + fs.existsSync(src) + '\n';

function copyTree(from, to, depth = 0) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const s = path.join(from, entry.name);
    const t = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyTree(s, t, depth + 1);
    } else {
      let done = false;
      for (let attempt = 1; attempt <= 5 && !done; attempt++) {
        try {
          fs.copyFileSync(s, t);
          done = true;
        } catch (e) {
          if (attempt === 5) out += `COPY-FAIL ${t} ${e.code}\n`;
        }
      }
    }
  }
}

try {
  fs.rmSync(target, { recursive: true, force: true });
  out += 'removed old client\n';
} catch (e) {
  out += 'rm failed: ' + e.code + '\n';
}

try {
  copyTree(src, target);
  out += 'copied generated client\n';
  out += 'target files: ' + fs.readdirSync(target).join(', ') + '\n';
} catch (e) {
  out += 'copy failed: ' + (e && e.code) + ' ' + (e && e.message) + '\n';
}

fs.writeFileSync(LOG, out, 'utf8');
console.log('done');