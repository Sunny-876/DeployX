const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const LOG = 'C:\\Users\\SUNNY\\AppData\\Local\\Temp\\cline\\deployx-build-all.log';

const targets = [
  { name: 'agent', cwd: 'D:\\DeployX\\apps\\agent', cli: 'node_modules\\@nestjs\\cli\\bin\\nest.js' },
  { name: 'api', cwd: 'D:\\DeployX\\apps\\api', cli: 'node_modules\\@nestjs\\cli\\bin\\nest.js' },
];

let out = '';

for (const target of targets) {
  out += `\n===== building ${target.name} =====\n`;
  let ok = false;

  for (let attempt = 1; attempt <= 6 && !ok; attempt++) {
    try {
      // A clean dist avoids Windows EBUSY errors on previously written files.
      try {
        fs.rmSync(path.join(target.cwd, 'dist'), { recursive: true, force: true });
      } catch {}

      out += execSync(`node ${target.cli} build`, {
        cwd: target.cwd,
        timeout: 300000,
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
      });
      out += `BUILD-OK ${target.name} (attempt ${attempt})\n`;
      ok = true;
    } catch (e) {
      const text = ((e.stdout || '') + '\n' + (e.stderr || '')).trim();
      out += `BUILD-FAIL ${target.name} attempt ${attempt}\n${text}\n`;
      if (!/EBUSY/.test(text)) break;
      out += '(transient file lock - retrying)\n';
    }
  }

  out += `${target.name} built: ${ok}\n`;
}

fs.writeFileSync(LOG, out, 'utf8');
console.log('done');