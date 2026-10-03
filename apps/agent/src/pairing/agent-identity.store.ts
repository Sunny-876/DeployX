import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export interface AgentIdentity {
  agentId: string;
  agentToken: string;
  apiUrl: string;
  userId?: string;
  name?: string;
  pairedAt?: string;
}

function candidateDirs(): string[] {
  const dirs: string[] = [];
  if (process.env.DEPLOYX_AGENT_DIR) dirs.push(process.env.DEPLOYX_AGENT_DIR);
  if (process.platform === 'win32') {
    const base = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    dirs.push(path.join(base, 'DeployX'));
  } else {
    dirs.push(path.join(os.homedir(), '.deployx'));
  }
  dirs.push(path.join(process.cwd(), '.deployx-agent'));
  return dirs;
}

export function resolveAgentDataDir(): string {
  for (const dir of candidateDirs()) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      return dir;
    } catch {}
  }
  return process.cwd();
}

export function identityPath(): string {
  return path.join(resolveAgentDataDir(), 'agent-identity.json');
}

export function loadIdentity(): AgentIdentity | null {
  for (const dir of candidateDirs()) {
    const file = path.join(dir, 'agent-identity.json');
    try {
      if (fs.existsSync(file)) {
        const raw = fs.readFileSync(file, 'utf8');
        const parsed = JSON.parse(raw) as AgentIdentity;
        if (parsed?.agentId && parsed?.agentToken) return parsed;
      }
    } catch {}
  }
  return null;
}

export function saveIdentity(identity: AgentIdentity): string {
  const file = identityPath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(identity, null, 2), { mode: 0o600 });
  try {
    fs.chmodSync(file, 0o600);
  } catch {}
  return file;
}

export function clearIdentity(): void {
  for (const dir of candidateDirs()) {
    try {
      const file = path.join(dir, 'agent-identity.json');
      if (fs.existsSync(file)) fs.rmSync(file, { force: true });
    } catch {}
  }
}
