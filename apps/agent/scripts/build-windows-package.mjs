import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import crypto from 'node:crypto';

const agentDir = path.resolve(import.meta.dirname, '..');
const repoRoot = path.resolve(agentDir, '../..');
const stagingDir = path.join(agentDir, 'package-staging');
const releasesDir = path.join(repoRoot, 'releases');

console.log('[1/7] Building DeployX Agent TypeScript bundle...');
execSync('pnpm --filter agent build', { cwd: repoRoot, stdio: 'inherit' });

console.log('[2/7] Preparing package staging directory...');
fs.mkdirSync(stagingDir, { recursive: true });
fs.mkdirSync(releasesDir, { recursive: true });

// Copy compiled dist
const distSource = path.join(agentDir, 'dist');
const distTarget = path.join(stagingDir, 'dist');
fs.cpSync(distSource, distTarget, { recursive: true, force: true });

// Copy package.json with production dependencies
const prodPackageJson = {
  name: 'deployx-agent',
  version: '0.1.1',
  private: true,
  main: 'dist/main.js',
  dependencies: {
    '@nestjs/common': '^11.1.6',
    '@nestjs/core': '^11.1.6',
    '@nestjs/platform-express': '^11.1.6',
    'dockerode': '^5.0.1',
    'reflect-metadata': '^0.2.2',
    'rxjs': '^7.8.2',
  },
};
fs.writeFileSync(
  path.join(stagingDir, 'package.json'),
  JSON.stringify(prodPackageJson, null, 2) + '\n',
);

// Install production dependencies in staging if not already present
const stagingNodeModules = path.join(stagingDir, 'node_modules');
if (!fs.existsSync(stagingNodeModules) || !fs.existsSync(path.join(stagingNodeModules, '@nestjs'))) {
  console.log('[3/7] Installing standalone production dependencies into staging...');
  execSync('npm install --omit=dev --no-audit --no-fund', {
    cwd: stagingDir,
    stdio: 'inherit',
  });
} else {
  console.log('[3/7] Standalone production dependencies already present.');
}

// Copy portable node.exe
console.log('[4/7] Packaging standalone Node.js runtime...');
const nodeTarget = path.join(stagingDir, 'node.exe');
if (!fs.existsSync(nodeTarget)) {
  fs.copyFileSync(process.execPath, nodeTarget);
}

// Check for and copy cloudflared if available
const cloudflaredCandidates = [
  'C:\\Program Files (x86)\\cloudflared\\cloudflared.exe',
  'C:\\Program Files\\cloudflared\\cloudflared.exe',
];
for (const cand of cloudflaredCandidates) {
  if (fs.existsSync(cand)) {
    console.log(`Packaging cloudflared from: ${cand}`);
    fs.copyFileSync(cand, path.join(stagingDir, 'cloudflared.exe'));
    break;
  }
}

// Write production config.json (configured with production Render API)
console.log('[5/7] Writing production Agent config.json...');
const productionConfig = {
  DEPLOYX_API_URL: 'https://deployx-lfl1.onrender.com',
  AGENT_PORT: 4100,
  AGENT_HEARTBEAT_INTERVAL_MS: 15000,
  BUILD_TIMEOUT_MS: 900000,
  STARTUP_TIMEOUT_MS: 600000,
  CONTAINER_MEMORY_LIMIT: '2g',
  CONTAINER_CPU_LIMIT: '2',
  CONTAINER_PIDS_LIMIT: '512',
  PORT_MIN: 3001,
  PORT_MAX: 3999,
};
fs.writeFileSync(
  path.join(stagingDir, 'config.json'),
  JSON.stringify(productionConfig, null, 2) + '\n',
);

// Write convenience batch launcher
const launcherContent = `@echo off\r\ncd /d "%~dp0"\r\necho Starting DeployX Agent on port 4100...\r\nstart "" "http://localhost:4100"\r\n"%~dp0node.exe" "%~dp0dist\\main.js"\r\n`;
fs.writeFileSync(path.join(stagingDir, 'DeployX-Agent.bat'), launcherContent);

// Find Inno Setup Compiler (ISCC)
console.log('[6/7] Locating Inno Setup Compiler (ISCC.exe)...');
const isccCandidates = [
  path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Inno Setup 6', 'ISCC.exe'),
  'C:\\Program Files (x86)\\Inno Setup 6\\ISCC.exe',
  'C:\\Program Files\\Inno Setup 6\\ISCC.exe',
];
let isccPath = isccCandidates.find((p) => p && fs.existsSync(p));

if (!isccPath) {
  try {
    const which = execSync('where.exe iscc', { encoding: 'utf8' }).trim().split(/\r?\n/)[0];
    if (which && fs.existsSync(which)) isccPath = which;
  } catch {}
}

if (!isccPath) {
  throw new Error('Inno Setup Compiler (ISCC.exe) not found. Please install Inno Setup 6.');
}

console.log(`Found ISCC at: ${isccPath}`);
const issPath = path.join(agentDir, 'installer', 'DeployX-Agent.iss');

console.log('[7/7] Compiling Windows installer with Inno Setup...');
execSync(`"${isccPath}" "${issPath}"`, { cwd: path.join(agentDir, 'installer'), stdio: 'inherit' });

const outputInstaller = path.join(releasesDir, 'DeployX-Agent-Setup-0.1.1.exe');
if (!fs.existsSync(outputInstaller)) {
  throw new Error(`Expected installer was not generated at: ${outputInstaller}`);
}

const stats = fs.statSync(outputInstaller);
const fileBuffer = fs.readFileSync(outputInstaller);
const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');

const checksumLine = `${sha256}  DeployX-Agent-Setup-0.1.1.exe\n`;
fs.appendFileSync(path.join(releasesDir, 'checksums.txt'), checksumLine);

console.log('\n==================================================');
console.log('DeployX Windows Agent Installer Build Complete!');
console.log(`Artifact:  ${outputInstaller}`);
console.log(`Size:      ${(stats.size / 1024 / 1024).toFixed(2)} MB (${stats.size} bytes)`);
console.log(`SHA-256:   ${sha256}`);
console.log('==================================================\n');
