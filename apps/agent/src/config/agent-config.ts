import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export interface AgentRuntimeConfig {
  DEPLOYX_API_URL?: string;
  AGENT_PORT?: number;
  AGENT_HEARTBEAT_INTERVAL_MS?: number;
  BUILD_TIMEOUT_MS?: number;
  STARTUP_TIMEOUT_MS?: number;
  CONTAINER_MEMORY_LIMIT?: string;
  CONTAINER_CPU_LIMIT?: string;
  CONTAINER_PIDS_LIMIT?: string;
  PORT_MIN?: number;
  PORT_MAX?: number;
  [key: string]: string | number | boolean | undefined;
}

const DEFAULT_AGENT_CONFIG: AgentRuntimeConfig = {
  DEPLOYX_API_URL: 'http://localhost:4000',
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

function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function readJsonConfig(filePath: string): Record<string, unknown> {
  if (!fileExists(filePath)) return {};
  try {
    const value = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function parseEnvFile(filePath: string): Record<string, string> {
  if (!fileExists(filePath)) return {};

  const result: Record<string, string> = {};
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    for (const rawLine of content.split(/\r?\n/)) {
      const trimmed = rawLine.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) continue;
      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();
      if (key) result[key] = value.replace(/^['"]|['"]$/g, '');
    }
  } catch {
    return {};
  }
  return result;
}

function candidateConfigPaths(): string[] {
  const paths: string[] = [];

  const overridePath = process.env.DEPLOYX_CONFIG_PATH || process.env.DEPLOYX_AGENT_CONFIG_PATH;
  if (overridePath) paths.push(path.resolve(overridePath));

  const cwdCandidates = [
    path.resolve(process.cwd(), 'config.json'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'apps', 'agent', 'config.json'),
    path.resolve(process.cwd(), 'apps', 'agent', '.env'),
  ];
  paths.push(...cwdCandidates);

  if (process.platform === 'win32') {
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    paths.push(path.join(appData, 'DeployX', 'config.json'));
    paths.push(path.join(appData, 'DeployX', '.env'));
    paths.push(path.join(os.homedir(), 'AppData', 'Local', 'DeployX', 'config.json'));
  } else {
    paths.push(path.join(os.homedir(), '.deployx', 'config.json'));
    paths.push(path.join(os.homedir(), '.deployx', '.env'));
  }

  return Array.from(new Set(paths.filter(Boolean)));
}

export function resolveAgentConfigPath(): string {
  const paths = candidateConfigPaths();
  const found = paths.find((filePath) => fileExists(filePath));
  return found || path.resolve(process.cwd(), 'config.json');
}

export function loadAgentConfig(): { configPath: string; config: AgentRuntimeConfig } {
  const configFilePath = resolveAgentConfigPath();
  const merged: AgentRuntimeConfig = { ...DEFAULT_AGENT_CONFIG };

  for (const candidate of candidateConfigPaths()) {
    if (!fileExists(candidate)) continue;

    if (candidate.endsWith('.json')) {
      Object.assign(merged, readJsonConfig(candidate));
    } else if (candidate.endsWith('.env')) {
      Object.assign(merged, parseEnvFile(candidate));
    }
  }

  for (const [key, value] of Object.entries(process.env)) {
    if (!key || value === undefined || value === '') continue;
    if (Object.prototype.hasOwnProperty.call(DEFAULT_AGENT_CONFIG, key) || key === 'DEPLOYX_API_URL') {
      merged[key] = value;
    }
  }

  const finalConfig = { ...DEFAULT_AGENT_CONFIG, ...merged };

  for (const [key, value] of Object.entries(finalConfig)) {
    if (value === undefined || value === null || value === '') continue;
    const envKey = key.toString();
    if (!process.env[envKey] || process.env[envKey] === '') {
      process.env[envKey] = String(value);
    }
  }

  return { configPath: configFilePath, config: finalConfig };
}

export function resolveApiUrl(defaultValue = 'http://localhost:4000'): string {
  return String(
    process.env.DEPLOYX_API_URL ||
      process.env.API_URL ||
      loadAgentConfig().config.DEPLOYX_API_URL ||
      defaultValue,
  );
}
