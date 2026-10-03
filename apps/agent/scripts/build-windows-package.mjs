import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve(import.meta.dirname, '..');
const packageRoot = path.join(rootDir, '..', 'agent-windows-package');
const distDir = path.join(packageRoot, 'windows');
const appDir = path.join(distDir, 'DeployX-Agent');

fs.mkdirSync(appDir, { recursive: true });

const filesToCopy = [
  'dist',
  'package.json',
  'pnpm-lock.yaml',
  'config.json',
  '.env.example',
  'README.md',
  'src',
  'test-project',
];

for (const relativePath of filesToCopy) {
  const source = path.join(rootDir, relativePath);
  const target = path.join(appDir, relativePath);
  if (!fs.existsSync(source)) continue;

  fs.cpSync(source, target, { recursive: true, force: true });
}

const installerDir = path.join(rootDir, 'installer');
fs.mkdirSync(installerDir, { recursive: true });

const checksumEntries = [];
const walk = (currentDir) => {
  for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const fullPath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (!entry.isFile()) continue;
    const hash = fs.readFileSync(fullPath);
    const relativePath = path.relative(appDir, fullPath).split(path.sep).join('/');
    checksumEntries.push(`${relativePath} ${hash.length}`);
  }
};
walk(appDir);
fs.writeFileSync(path.join(distDir, 'checksums.txt'), checksumEntries.join('\n') + '\n');

console.log(`Windows package prepared at ${appDir}`);
console.log(`Inno Setup source script: ${path.join(rootDir, 'installer', 'DeployX-Agent.iss')}`);
