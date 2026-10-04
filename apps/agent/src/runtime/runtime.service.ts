import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';

import Docker from 'dockerode';
import { PortService } from './port.service';
import * as crypto from 'node:crypto';
import * as fs from 'fs';
import * as os from 'node:os';
import * as path from 'path';

import {
  ProjectDetectorService,
} from '../detector/project-detector.service';
import {
  HealthService,
} from './health.service';

/**
 * Docker labels are the reliable runtime metadata for DeployX containers.
 * DeployX never trusts container names alone.
 */
export const DEPLOYX_LABELS = {
  managed: 'com.deployx.managed',
  projectId: 'com.deployx.project-id',
  userId: 'com.deployx.user-id',
  deploymentId: 'com.deployx.deployment-id',
  projectName: 'com.deployx.project-name',
  createdAt: 'com.deployx.created-at',
} as const;

export interface DeployMetadata {
  projectId?: string | null;
  userId?: string | null;
  deploymentId?: string | null;
  projectName?: string | null;
}

export function parseMemory(val?: string, defaultBytes = 2 * 1024 * 1024 * 1024): number {
  if (!val) return defaultBytes;
  const match = String(val).trim().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|k|kb|m|mb|g|gb)?$/);
  if (!match) return defaultBytes;
  const num = parseFloat(match[1]);
  const unit = match[2] || 'b';
  if (unit.startsWith('g')) return Math.round(num * 1024 * 1024 * 1024);
  if (unit.startsWith('m')) return Math.round(num * 1024 * 1024);
  if (unit.startsWith('k')) return Math.round(num * 1024);
  return Math.round(num);
}

export function parseCpuLimit(val?: string, defaultCpus = 2): number {
  const num = parseFloat(String(val || defaultCpus));
  return Number.isFinite(num) && num > 0 ? Math.round(num * 1e9) : defaultCpus * 1e9;
}

export function parsePidsLimit(val?: string, defaultPids = 512): number {
  const num = parseInt(String(val || defaultPids), 10);
  return Number.isFinite(num) && num > 0 ? num : defaultPids;
}

export function sanitizeLog(rawLine: string): string {
  if (!rawLine || typeof rawLine !== 'string') return '';
  return rawLine
    .replace(/^[\u0000-\u001F\u007F-\u009F]+/, '')
    .replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '')
    .trim()
    .replace(/eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g, '[REDACTED_JWT]')
    .replace(/(postgres(?:ql)?:\/\/[^:]+:)([^@]+)(@)/gi, '$1[REDACTED_PASSWORD]$3')
    .replace(/(?:token|secret|password|key)\s*[:=]\s*([a-zA-Z0-9_\-\.]+)/gi, 'secret=[REDACTED]')
    .replace(/Bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer [REDACTED]');
}

@Injectable()
export class RuntimeService implements OnModuleInit {
  private readonly logger = new Logger(RuntimeService.name);
  private readonly docker = new Docker();

  private readonly runtimes = new Map<
    string,
    {
      containerId: string;
      port: number;
    }
  >();

  private readonly activeBuilds = new Map<
    string,
    {
      container: any;
      port: number;
      abort: (reason?: string) => void;
    }
  >();

  async cancelDeployment(deploymentId: string): Promise<boolean> {
    const active = this.activeBuilds.get(deploymentId);
    if (active) {
      this.logger.warn(`Cancelling active deployment ${deploymentId}`);
      try {
        active.abort('Deployment cancelled by user');
      } catch {}
      try {
        await active.container.kill();
      } catch {}
      try {
        await active.container.remove({ force: true });
      } catch {}
      this.portService.releasePort(active.port);
      this.activeBuilds.delete(deploymentId);
      return true;
    }
    return false;
  }

  constructor(
    private readonly portService: PortService,
    private readonly detector: ProjectDetectorService,
    private readonly health: HealthService,
  ) {}

  async onModuleInit() {
    try {
      await this.docker.ping();
      this.logger.log('Docker connection successful');
    } catch (error) {
      this.logger.error(
        'Docker is not available',
        error instanceof Error ? error.message : error,
      );
    }
  }

  async status() {
    try {
      await this.docker.ping();

      const info = await this.docker.info();

      return {
        connected: true,
        dockerAvailable: true,
        containers: info.Containers,
        running: info.ContainersRunning,
        stopped: info.ContainersStopped,
        message: 'Docker is ready.',
      };
    } catch (error) {
      const message = 'Docker is required to run your projects. Start Docker Desktop and try again.';
      return {
        connected: false,
        dockerAvailable: false,
        containers: 0,
        running: 0,
        stopped: 0,
        message,
        error: error instanceof Error ? error.message : 'Docker unavailable',
      };
    }
  }

  async listContainers() {
    return this.docker.listContainers({
      all: true,
    });
  }

  private buildManagedLabels(meta: DeployMetadata): Record<string, string> {
    return {
      [DEPLOYX_LABELS.managed]: 'true',
      [DEPLOYX_LABELS.projectId]: meta.projectId || '',
      [DEPLOYX_LABELS.userId]: meta.userId || '',
      [DEPLOYX_LABELS.deploymentId]: meta.deploymentId || '',
      [DEPLOYX_LABELS.projectName]: meta.projectName || '',
      [DEPLOYX_LABELS.createdAt]: new Date().toISOString(),
    };
  }

  private normalizeContainer(container: any) {
    const labels = container?.Labels || {};
    const ports = container?.Ports || [];
    const published = ports.find((p: any) => p?.PublicPort) || ports[0] || null;

    const missingMetadata: string[] = [];
    if (!labels[DEPLOYX_LABELS.projectId]) missingMetadata.push(DEPLOYX_LABELS.projectId);
    if (!labels[DEPLOYX_LABELS.userId]) missingMetadata.push(DEPLOYX_LABELS.userId);
    if (!labels[DEPLOYX_LABELS.deploymentId]) missingMetadata.push(DEPLOYX_LABELS.deploymentId);

    return {
      containerId: container?.Id,
      containerName: (container?.Names?.[0] || '').replace(/^\//, '') || null,
      image: container?.Image || null,
      state: container?.State || null,
      managed: labels[DEPLOYX_LABELS.managed] === 'true',
      projectId: labels[DEPLOYX_LABELS.projectId] || null,
      userId: labels[DEPLOYX_LABELS.userId] || null,
      deploymentId: labels[DEPLOYX_LABELS.deploymentId] || null,
      projectName: labels[DEPLOYX_LABELS.projectName] || null,
      port: published?.PublicPort ?? null,
      privatePort: published?.PrivatePort ?? null,
      createdAt: container?.Created
        ? new Date(container.Created * 1000).toISOString()
        : null,
      missingMetadata,
    };
  }

  /**
   * Inspect Docker and split the result into DeployX-managed containers and
   * everything else. Only containers carrying `com.deployx.managed=true` are
   * ever reported as DeployX runtimes (security requirement).
   */
  async managedRuntime(): Promise<{
    dockerAvailable: boolean;
    containers: any[];
    unmanaged: any[];
  }> {
    try {
      const all = await this.docker.listContainers({ all: true });
      const normalized = (all || []).map((c) => this.normalizeContainer(c));

      return {
        dockerAvailable: true,
        containers: normalized.filter((c) => c.managed),
        unmanaged: normalized.filter((c) => !c.managed),
      };
    } catch {
      return { dockerAvailable: false, containers: [], unmanaged: [] };
    }
  }

  async listManagedContainers() {
    const runtime = await this.managedRuntime();
    return runtime.containers;
  }

  async getContainerState(containerId: string): Promise<string | null> {
    try {
      const info = await this.docker.getContainer(containerId).inspect();
      return info?.State?.Status || null;
    } catch {
      return null;
    }
  }

  private async ensureImage(imageName: string): Promise<void> {
    try {
      const image = this.docker.getImage(imageName);
      await image.inspect();
    } catch {
      this.logger.log(`Image "${imageName}" not found locally. Pulling...`);
      await new Promise<void>((resolve, reject) => {
        this.docker.pull(imageName, (err: any, stream: any) => {
          if (err) return reject(err);
          this.docker.modem.followProgress(stream, (finishErr: any) => {
            if (finishErr) return reject(finishErr);
            resolve();
          });
        });
      });
      this.logger.log(`Image "${imageName}" pulled successfully`);
    }
  }

  async startTestContainer() {
    const containerName = `deployx-runtime-test-${Date.now()}`;
    const imageName = 'nginx:alpine';

    const port = await this.portService.getFreePort();

    try {
      await this.ensureImage(imageName);

      const container = await this.docker.createContainer({
        name: containerName,

        Image: imageName,

        ExposedPorts: {
          '80/tcp': {},
        },

        HostConfig: {
          PortBindings: {
            '80/tcp': [
              {
                HostPort: String(port),
              },
            ],
          },
        },
      });

      await container.start();

      this.runtimes.set(container.id, {
        containerId: container.id,
        port,
      });

      this.logger.log(`Runtime started on port ${port}`);

      return {
        success: true,
        containerId: container.id,
        name: containerName,
        port,
        url: `http://localhost:${port}`,
      };
    } catch (error) {
      this.portService.releasePort(port);

      throw error;
    }
  }

  async stopRuntime(containerId: string) {
    const container = this.docker.getContainer(containerId);

    let port: number | undefined;

    for (const [id, runtime] of this.runtimes.entries()) {
      if (runtime.containerId === containerId) {
        port = runtime.port;
        this.runtimes.delete(id);
        break;
      }
    }

    try {
      await container.stop();
    } catch {}

    try {
      await container.remove();
    } catch {}

    if (port) {
      this.portService.releasePort(port);
    }

    return {
      success: true,
      containerId,
      message: 'Runtime stopped',
    };
  }

  async inspectContainer(containerId: string) {
    const container = this.docker.getContainer(containerId);
    return container.inspect();
  }

  async getContainerLogs(containerId: string): Promise<string> {
    try {
      const container = this.docker.getContainer(containerId);
      const logs = await container.logs({
        stdout: true,
        stderr: true,
        tail: 100,
      });
      return logs.toString('utf8');
    } catch (e) {
      return `Failed to fetch logs: ${e}`;
    }
  }

  async stopContainer(containerId: string): Promise<void> {
    const container = this.docker.getContainer(containerId);
    try {
      await container.stop();
      this.logger.log(`Container ${containerId} stopped`);
    } catch (e) {
      this.logger.warn(`Could not stop container ${containerId}: ${e}`);
    }
  }

  async startContainer(containerId: string): Promise<void> {
    const container = this.docker.getContainer(containerId);
    await container.start();
    this.logger.log(`Container ${containerId} started`);
  }

  async pauseContainer(containerId: string): Promise<void> {
    const container = this.docker.getContainer(containerId);

    await container.pause();

    this.logger.log(
      `Container ${containerId} paused`,
    );
  }

  async resumeContainer(containerId: string): Promise<void> {
    const container = this.docker.getContainer(containerId);

    await container.unpause();

    this.logger.log(
      `Container ${containerId} resumed`,
    );
  }

  async waitForHealth(
    port: number,
    timeoutMs = 600000,
  ): Promise<boolean> {
    return this.health.waitForHttp(port, timeoutMs);
  }

  private resolveProjectRoot(dir: string): string {
    if (
      fs.existsSync(path.join(dir, 'package.json')) ||
      fs.existsSync(path.join(dir, 'index.html'))
    ) {
      return dir;
    }

    try {
      const entries = fs
        .readdirSync(dir, { withFileTypes: true })
        .filter(
          (e) =>
            e.isDirectory() &&
            !['__MACOSX', '.git', 'node_modules'].includes(e.name),
        );

      if (entries.length === 1) {
        const sub = path.join(dir, entries[0].name);
        return this.resolveProjectRoot(sub);
      }

      for (const entry of entries) {
        const sub = path.join(dir, entry.name);
        if (
          fs.existsSync(path.join(sub, 'package.json')) ||
          fs.existsSync(path.join(sub, 'index.html'))
        ) {
          return sub;
        }
      }
    } catch {}

    return dir;
  }

  private formatStageDuration(start: number): string {
    const seconds = ((Date.now() - start) / 1000).toFixed(1);
    return `${seconds}s`;
  }

  private resolveDependencyCache(projectPath: string, detection: ReturnType<ProjectDetectorService['detect']>) {
    if (!projectPath || detection.packageManager === 'none') {
      return { shouldInstall: false, cacheDir: null, reused: false };
    }

    const packageManagerFiles = [
      'package.json',
      'package-lock.json',
      'pnpm-lock.yaml',
      'yarn.lock',
    ];

    const digestSource = [
      detection.packageManager,
      process.version,
    ];

    for (const fileName of packageManagerFiles) {
      const filePath = path.join(projectPath, fileName);
      if (fs.existsSync(filePath)) {
        digestSource.push(fileName);
        digestSource.push(fs.readFileSync(filePath, 'utf8'));
      }
    }

    const cacheKey = crypto
      .createHash('sha256')
      .update(digestSource.join('\n'))
      .digest('hex')
      .slice(0, 24);

    const cacheDir = path.join(
      os.homedir(),
      '.deployx',
      'dependency-cache',
      detection.packageManager,
      cacheKey,
    );

    const cachedNodeModules = path.join(cacheDir, 'node_modules');
    const projectNodeModules = path.join(projectPath, 'node_modules');

    if (fs.existsSync(cachedNodeModules)) {
      if (!fs.existsSync(projectNodeModules)) {
        fs.mkdirSync(projectPath, { recursive: true });
        fs.cpSync(cachedNodeModules, projectNodeModules, { recursive: true, force: true });
      }
      return { shouldInstall: false, cacheDir, reused: true };
    }

    return { shouldInstall: true, cacheDir, reused: false };
  }

  private persistDependencyCache(
    projectPath: string,
    detection: ReturnType<ProjectDetectorService['detect']>,
    cacheState: { cacheDir: string | null },
  ) {
    if (!cacheState.cacheDir || detection.packageManager === 'none') {
      return;
    }

    const projectNodeModules = path.join(projectPath, 'node_modules');
    if (!fs.existsSync(projectNodeModules)) {
      return;
    }

    const cacheNodeModules = path.join(cacheState.cacheDir, 'node_modules');
    fs.mkdirSync(cacheState.cacheDir, { recursive: true });
    fs.cpSync(projectNodeModules, cacheNodeModules, { recursive: true, force: true });
  }

  private buildShellCommand(
    detection: ReturnType<ProjectDetectorService['detect']>,
    skipInstall: boolean,
  ): string[] {
    const commands: string[] = [];

    if (detection.installCommand && !skipInstall) {
      commands.push(
        `echo "[Deploy] Dependencies start" && start=$(date +%s) && ${detection.installCommand} && end=$(date +%s) && echo "[Deploy] Dependencies: $((end-start))s"`,
      );
    }

    if (detection.buildCommand) {
      commands.push(
        `echo "[Deploy] Build start" && start=$(date +%s) && ${detection.buildCommand} && end=$(date +%s) && echo "[Deploy] Build: $((end-start))s"`,
      );
    }

    commands.push(detection.startCommand);
    return commands;
  }

  private prepareProjectCommand(
    projectPath: string,
  ): {
    command: string[];
    detection: ReturnType<
      ProjectDetectorService['detect']
    >;
    cacheState: { shouldInstall: boolean; cacheDir: string | null; reused: boolean };
  } {
    const detection =
      this.detector.detect(
        projectPath,
      );

    const cacheState = this.resolveDependencyCache(projectPath, detection);

    this.logger.log(
      `Detected project type: ${detection.type}`,
    );

    this.logger.log(
      `Detected project name: ${detection.name}`,
    );

    this.logger.log(
      `Detected package manager: ${detection.packageManager}`,
    );

    if (cacheState.reused) {
      this.logger.log(`Reusing dependency cache for ${detection.packageManager} project.`);
    } else if (detection.installCommand && !cacheState.shouldInstall) {
      this.logger.log('Dependency cache warm but no install needed.');
    }

    // -----------------------------
    // STATIC
    // -----------------------------

    if (
      detection.type === 'static'
    ) {
      const serverScriptPath =
        path.join(
          projectPath,
          '_deployx_serve.js',
        );

      const serverCode = `
const http = require('http');
const fs = require('fs');
const path = require('path');

const targetDir =
  process.env.SERVE_DIR || '.';

const port =
  parseInt(
    process.env.PORT || '3000',
    10,
  );

const host = '0.0.0.0';

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8'
};

const server =
  http.createServer(
    (req, res) => {
      const urlPath =
        decodeURI(
          (req.url || '/')
            .split('?')[0],
        );

      let filePath =
        path.join(
          targetDir,
          urlPath,
        );

      if (
        fs.existsSync(filePath) &&
        fs.statSync(filePath).isDirectory()
      ) {
        filePath =
          path.join(
            filePath,
            'index.html',
          );
      }

      if (
        !fs.existsSync(filePath)
      ) {
        const fallback =
          path.join(
            targetDir,
            'index.html',
          );

        if (
          fs.existsSync(fallback)
        ) {
          filePath = fallback;
        }
      }

      if (
        !fs.existsSync(filePath) ||
        fs.statSync(filePath).isDirectory()
      ) {
        res.writeHead(
          404,
          {
            'Content-Type':
              'text/plain',
          },
        );

        res.end(
          'Not Found',
        );

        return;
      }

      const ext =
        path.extname(
          filePath,
        ).toLowerCase();

      const contentType =
        mimeTypes[ext] ||
        'application/octet-stream';

      res.writeHead(
        200,
        {
          'Content-Type':
            contentType,
        },
      );

      fs.createReadStream(
        filePath,
      ).pipe(res);
    },
  );

server.listen(
  port,
  host,
  () => {
    console.log(
      '[DeployX] Static runtime ready on ' +
      'http://' +
      host +
      ':' +
      port,
    );
  },
);
`;

      fs.writeFileSync(
        serverScriptPath,
        serverCode.trim(),
        'utf8',
      );

      return {
        detection,
        cacheState,
        command: [
          'sh',
          '-c',
          'SERVE_DIR=. node _deployx_serve.js',
        ],
      };
    }

    // -----------------------------
    // NODE / NEXT.JS
    // -----------------------------

    if (
      detection.type === 'nextjs' ||
      detection.type === 'node'
    ) {
      return {
        detection,
        cacheState,
        command: [
          'sh',
          '-c',
          this.buildShellCommand(detection, !cacheState.shouldInstall).join(' && '),
        ],
      };
    }

    // -----------------------------
    // PYTHON
    // -----------------------------
    //
    // Python will be enabled after
    // the Python Docker image is added.
    // Do not accidentally try to run
    // Python inside node:22-alpine.

    if (
      detection.type === 'python'
    ) {
      throw new BadRequestException(
        'Python projects are detected but Python runtime support is not enabled yet.',
      );
    }

    throw new BadRequestException(
      'Unsupported project type.',
    );
  }

  async deployProject(
    projectPath: string,
    onLog?: (line: string) => void,
    meta: DeployMetadata = {},
  ) {
    if (!projectPath) {
      throw new BadRequestException('projectPath is required');
    }

    const absolutePath = path.resolve(projectPath);

    if (!fs.existsSync(absolutePath)) {
      throw new NotFoundException(
        `Project directory does not exist: ${absolutePath}`,
      );
    }

    const totalStart = Date.now();
    const effectivePath = this.resolveProjectRoot(absolutePath);
    this.logger.log(`Resolved project root: ${effectivePath}`);

    const runtimeConfig =
      this.prepareProjectCommand(
        effectivePath,
      );

    const cmd =
      runtimeConfig.command;

    const detection =
      runtimeConfig.detection;

    const projectPrepStart = Date.now();
    onLog?.(`Project detected: ${detection.type}`);
    onLog?.(runtimeConfig.cacheState.reused
      ? '[Deploy] Reusing dependency cache for a previously installed dependency set.'
      : 'Installing dependencies & building project...');
    onLog?.(`[Deploy] Framework detection: ${this.formatStageDuration(projectPrepStart)} `);

    this.logger.log(
      `Project type: ${detection.type}`,
    );

    this.logger.log(
      `Project root: ${detection.projectRoot}`,
    );

    this.logger.log(
      `Runtime command: ${JSON.stringify(cmd)}`,
    );

    const port = await this.portService.getFreePort();

    const containerName = `deployx-app-${Date.now()}`;

    let container: any;
    let logStream: any = null;
    let buildTimeoutTimer: NodeJS.Timeout | null = null;

    try {
      const containerCreationStart = Date.now();
      await this.ensureImage('node:22-alpine');
      onLog?.(`[Deploy] Container prep: ${this.formatStageDuration(containerCreationStart)}`);

      const normalizedMountPath = effectivePath.replace(/\\/g, '/');

      const buildTimeoutMs = Number(process.env.BUILD_TIMEOUT_MS) || 900000;
      const startupTimeoutMs = Number(process.env.STARTUP_TIMEOUT_MS) || 600000;

      let buildTimedOut = false;
      let cancelled = false;
      let containerExitReason: string | null = null;
      let containerExited = false;

      container = await this.docker.createContainer({
        name: containerName,

        Image: 'node:22-alpine',

        WorkingDir: '/app',

        Cmd: cmd,

        // Runtime metadata that lets the agent re-discover this container after
        // a restart and lets the API reconcile ownership.
        Labels: this.buildManagedLabels({
          projectId: meta.projectId,
          userId: meta.userId,
          deploymentId: meta.deploymentId,
          projectName: meta.projectName || detection.name,
        }),

        Env: [
          'PORT=3000',
          'HOST=0.0.0.0',
          `DEPLOYX_PROJECT_TYPE=${detection.type}`,
          // Give Node.js/Next.js builds enough heap; stays below container memory limit
          'NODE_OPTIONS=--max-old-space-size=1536',
        ],

        ExposedPorts: {
          '3000/tcp': {},
        },

        HostConfig: {
          Binds: [
            `${normalizedMountPath}:/app`,
          ],

          PortBindings: {
            '3000/tcp': [
              {
                HostPort: String(port),
              },
            ],
          },

          Memory: parseMemory(process.env.CONTAINER_MEMORY_LIMIT, 2 * 1024 * 1024 * 1024),
          NanoCpus: parseCpuLimit(process.env.CONTAINER_CPU_LIMIT, 2),
          PidsLimit: parsePidsLimit(process.env.CONTAINER_PIDS_LIMIT, 512),
          SecurityOpt: ['no-new-privileges:true'],
        },
      });

      if (meta.deploymentId) {
        this.activeBuilds.set(meta.deploymentId, {
          container,
          port,
          abort: (reason?: string) => {
            cancelled = true;
            if (reason) containerExitReason = reason;
          },
        });
      }

      const containerStartTimer = Date.now();
      await container.start();
      onLog?.(`[Deploy] Container startup: ${this.formatStageDuration(containerStartTimer)}`);

      buildTimeoutTimer = setTimeout(() => {
        buildTimedOut = true;
        this.logger.error(`Build timed out after ${Math.round(buildTimeoutMs / 60000)} minutes`);
        container.kill().catch(() => {});
      }, buildTimeoutMs);

      if (onLog) {
        try {
          const stream = await container.logs({
            follow: true,
            stdout: true,
            stderr: true,
            timestamps: false,
          });

          logStream = stream;

          let logBuffer = '';
          stream.on('data', (chunk: Buffer) => {
            const raw = chunk.toString('utf8');
            logBuffer += raw;
            const lines = logBuffer.split('\n');
            logBuffer = lines.pop() || '';

            for (const rawLine of lines) {
              const line = sanitizeLog(rawLine);
              if (line && line.length > 1) {
                if (
                  !line.includes('Attention: Next.js now collects completely anonymous telemetry')
                ) {
                  onLog(line);
                }
              }
            }
          });
        } catch (err: any) {
          this.logger.warn(`Could not attach log stream to container: ${err.message}`);
        }
      }

      this.runtimes.set(
        container.id,
        {
          containerId: container.id,
          port,
        },
      );

      this.logger.log(
        `Project deployed on port ${port}`,
      );

      this.logger.log(
        `Waiting for application on port ${port}...`,
      );

      // -------------------------------------------------------
      // Monitor container exit WHILE waiting for health.
      // If Docker OOM-kills or crashes the container we detect
      // it immediately instead of waiting the full timeout.
      // -------------------------------------------------------
      const exitWatcher = (async () => {
        try {
          const waitResult = await container.wait();
          containerExited = true;
          const exitCode: number = waitResult?.StatusCode ?? -1;
          if (exitCode !== 0) {
            // Inspect to detect OOM
            try {
              const info = await container.inspect();
              const oomKilled: boolean =
                info?.State?.OOMKilled === true;
              if (oomKilled) {
                containerExitReason =
                  `Build was killed by Docker OOM killer (out of memory). ` +
                  `Exit code: ${exitCode}. ` +
                  `Try reducing dependencies or splitting the build.`;
              } else {
                containerExitReason =
                  `Build process exited unexpectedly with code ${exitCode}.`;
              }
            } catch {
              containerExitReason =
                `Container exited with code ${exitCode}.`;
            }
          }
        } catch {
          // container.wait() throws if already removed — safe to ignore
        }
      })();

      const healthStart = Date.now();
      const healthy =
        await this.health.waitForHttpWithExitGuard(
          port,
          startupTimeoutMs,
          () => containerExited || buildTimedOut || cancelled,
        );
      onLog?.(`[Deploy] Health check: ${this.formatStageDuration(healthStart)}`);

      if (buildTimeoutTimer) {
        clearTimeout(buildTimeoutTimer);
        buildTimeoutTimer = null;
      }

      // Cleanup exit watcher reference (fire-and-forget, already resolved)
      void exitWatcher;

      if (logStream) {
        try {
          logStream.destroy();
        } catch {}
      }

      if (!healthy) {
        await container.stop().catch(() => {});
        await container.remove({
          force: true,
        }).catch(() => {});

        let reason: string | null = containerExitReason;
        if (cancelled) {
          reason = 'Deployment was cancelled by user.';
        } else if (buildTimedOut) {
          reason = `Project build timed out after ${Math.round(buildTimeoutMs / 60000)} minutes.`;
        } else if (!reason) {
          reason = `Application failed health check: unreachable on port ${port} after ${Math.round(startupTimeoutMs / 1000)} seconds.`;
        }

        throw new BadRequestException(reason);
      }

      onLog?.(`[Deploy] Total deployment time: ${this.formatStageDuration(totalStart)}`);
      this.logger.log(`[Deploy] Total deployment time: ${this.formatStageDuration(totalStart)}`);

      this.persistDependencyCache(effectivePath, detection, runtimeConfig.cacheState);

      return {
        success: true,

        containerId:
          container.id,

        name:
          containerName,

        type:
          detection.type,

        projectName:
          detection.name,

        packageManager:
          detection.packageManager,

        port,

        url:
          `http://localhost:${port}`,

        projectPath:
          effectivePath,

        buildCommand:
          detection.buildCommand,

        startCommand:
          detection.startCommand,
      };
    } catch (error) {
      if (buildTimeoutTimer) {
        clearTimeout(buildTimeoutTimer);
        buildTimeoutTimer = null;
      }
      if (container) {
        try {
          await container.remove({ force: true });
        } catch {}
      }

      this.portService.releasePort(port);

      throw error;
    } finally {
      if (meta.deploymentId) {
        this.activeBuilds.delete(meta.deploymentId);
      }
    }
  }
}