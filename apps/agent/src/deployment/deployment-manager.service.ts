import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import * as fs from 'fs';
import * as path from 'path';

import {
  DeploymentState,
} from './deployment-state';

import {
  RuntimeService,
} from '../runtime/runtime.service';

import {
  TunnelService,
} from '../tunnel/tunnel.service';
import { resolveAgentDataDir } from '../pairing/agent-identity.store';

@Injectable()
export class DeploymentManagerService {
  private deployments =
    new Map<string, DeploymentState>();

  private readonly storagePath = path.join(
    process.cwd(),
    'deployments-store.json',
  );

  private runtimeChangeListener?: () => void;

  constructor(
    private readonly runtime: RuntimeService,
    private readonly tunnel: TunnelService,
  ) {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.storagePath)) {
        const raw = fs.readFileSync(this.storagePath, 'utf8');
        const entries: [string, DeploymentState][] = JSON.parse(raw);
        this.deployments = new Map(entries);
      }
    } catch {}
  }

  private saveToDisk() {
    try {
      const entries = Array.from(this.deployments.entries());
      fs.writeFileSync(
        this.storagePath,
        JSON.stringify(entries, null, 2),
        'utf8',
      );
    } catch {}
  }

  create(
    deploymentId: string,
    projectPath: string,
    meta?: {
      projectId?: string | null;
      userId?: string | null;
      projectName?: string | null;
    },
  ): DeploymentState {
    const now =
      new Date().toISOString();

    const deployment: DeploymentState = {
      deploymentId,
      projectPath,

      containerId: null,
      containerName: null,

      port: null,

      status: 'BUILDING',

      publicUrl: null,

      projectId: meta?.projectId ?? null,
      userId: meta?.userId ?? null,
      projectName: meta?.projectName ?? null,

      logs: [],

      createdAt: now,
      updatedAt: now,
    };

    this.deployments.set(
      deploymentId,
      deployment,
    );

    this.saveToDisk();

    return deployment;
  }

  async get(
    deploymentId: string,
  ): Promise<DeploymentState> {
    const existing =
      this.deployments.get(
        deploymentId,
      );

    if (existing) {
      return existing;
    }

    // Auto-discover the runtime in Docker if the agent restarted.
    // Discovery is label-driven: only DeployX-managed containers are considered.
    try {
      const containers =
        await this.runtime.listManagedContainers();

      const appContainer = containers.find(
        (c: any) =>
          c.deploymentId === deploymentId ||
          c.projectId ||
          c.containerId,
      );

      if (appContainer) {
        const publicPort = appContainer.port ?? null;
        const containerName =
          appContainer.containerName || 'deployx-app';
        const isPaused =
          appContainer.state === 'paused' ||
          appContainer.state === 'exited';
        const isRunning =
          appContainer.state === 'running';

        const tunnelUrl = this.tunnel.getUrl();
        const hasValidTunnel =
          isRunning &&
          !!tunnelUrl &&
          tunnelUrl.includes('trycloudflare.com');

        const recovered: DeploymentState = {
          deploymentId,
          projectPath: 'D:\\DeployX\\runtime-projects\\bluepeak-test',
          containerId: appContainer.containerId,
          containerName,
          port: publicPort,
          status: isPaused
            ? 'PAUSED'
            : hasValidTunnel
            ? 'READY'
            : 'RUNNING',
          publicUrl: hasValidTunnel ? tunnelUrl : null,
          projectId: appContainer.projectId ?? null,
          userId: appContainer.userId ?? null,
          projectName: appContainer.projectName ?? null,
          logs: [
            `[${new Date().toLocaleTimeString()}] Existing container discovered: ${containerName}`,
            `[${new Date().toLocaleTimeString()}] State: ${appContainer.state}, Port: ${publicPort}`,
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        this.deployments.set(deploymentId, recovered);
        this.saveToDisk();

        return recovered;
      }
    } catch {}

    throw new NotFoundException(
      `Deployment not found: ${deploymentId}`,
    );
  }

  async update(
    deploymentId: string,
    data: Partial<DeploymentState>,
  ): Promise<DeploymentState> {
    const deployment =
      await this.get(deploymentId);

    Object.assign(
      deployment,
      data,
      {
        updatedAt:
          new Date().toISOString(),
      },
    );

    this.saveToDisk();

    return deployment;
  }

  async log(
    deploymentId: string,
    message: string,
  ): Promise<DeploymentState> {
    const deployment =
      await this.get(deploymentId);

    const timestamp =
      new Date().toLocaleTimeString();

    deployment.logs.push(
      `[${timestamp}] ${message}`,
    );

    deployment.updatedAt =
      new Date().toISOString();

    this.saveToDisk();

    return deployment;
  }

  /*
   * -------------------------------------------------------------
   * INITIAL DEPLOYMENT (DOCKER -> HEALTH -> CLOUDFLARE -> READY)
   * -------------------------------------------------------------
   */
  async deploy(
    deploymentId: string,
    projectPath: string,
    meta?: {
      projectId?: string | null;
      userId?: string | null;
      projectName?: string | null;
    },
    externalOnLog?: (line: string) => void,
  ) {
    if (!projectPath) {
      throw new BadRequestException('projectPath is required');
    }

    const deployment = this.create(deploymentId, projectPath, meta);

    await this.log(deploymentId, 'Starting deployment...');
    await this.log(deploymentId, `Project: ${projectPath}`);
    await this.log(deploymentId, 'Detecting project...');

    try {
      const onLog = (line: string) => {
        void this.log(deploymentId, line);
        if (externalOnLog) {
          try {
            externalOnLog(line);
          } catch {}
        }
      };

      // 1. Start Docker runtime (container carries DeployX labels) & wait for health
      const result = await this.runtime.deployProject(
        projectPath,
        onLog,
        {
          projectId: meta?.projectId ?? null,
          userId: meta?.userId ?? null,
          deploymentId,
          projectName: meta?.projectName ?? null,
        },
      );

      if (!result?.success) {
        deployment.status = 'FAILED';
        this.saveToDisk();
        await this.log(deploymentId, 'Deployment failed: Runtime error');
        throw new Error('Runtime deployment failed');
      }

      deployment.containerId = result.containerId ?? null;
      deployment.containerName = result.name ?? null;
      deployment.port = result.port ?? null;
      deployment.status = 'RUNNING';
      deployment.updatedAt = new Date().toISOString();
      this.saveToDisk();

      await this.log(deploymentId, 'Application started successfully.');
      await this.log(deploymentId, `Application port: ${result.port}`);
      await this.log(deploymentId, 'Health check passed.');

      // 2. Start Cloudflare Quick Tunnel
      deployment.status = 'CREATING_TUNNEL';
      deployment.updatedAt = new Date().toISOString();
      this.saveToDisk();

      await this.log(deploymentId, 'Creating temporary public URL...');

      let publicUrl: string;
      try {
        publicUrl = await this.tunnel.start(Number(result.port));
      } catch (tunnelError: any) {
        deployment.status = 'FAILED';
        deployment.publicUrl = null;
        deployment.updatedAt = new Date().toISOString();
        this.saveToDisk();
        const errorMsg =
          tunnelError instanceof Error
            ? tunnelError.message
            : String(tunnelError);
        await this.log(
          deploymentId,
          `Cloudflare tunnel failed: ${errorMsg}`,
        );
        throw new Error(`Cloudflare tunnel failed: ${errorMsg}`);
      }

      if (!publicUrl || !publicUrl.includes('trycloudflare.com')) {
        deployment.status = 'FAILED';
        deployment.publicUrl = null;
        deployment.updatedAt = new Date().toISOString();
        this.saveToDisk();
        await this.log(
          deploymentId,
          'Cloudflare tunnel failed: No valid trycloudflare.com URL received',
        );
        throw new Error(
          'Cloudflare tunnel failed: No valid trycloudflare.com URL received',
        );
      }

      // 3. Mark READY only after tunnel is ready and publicUrl is assigned!
      deployment.publicUrl = publicUrl;
      deployment.status = 'READY';
      deployment.updatedAt = new Date().toISOString();
      this.saveToDisk();

      await this.log(deploymentId, 'Public tunnel created.');
      await this.log(deploymentId, `Public URL: ${publicUrl}`);
      await this.log(deploymentId, 'Deployment ready.');

      this.notifyRuntimeChanged();

      return {
        success: true,
        deploymentId,
        status: 'READY',
        publicUrl,
        localUrl: result.url || `http://localhost:${result.port}`,
        port: result.port,
        containerId: result.containerId,
        projectPath,
      };
    } catch (error: any) {
      deployment.status = 'FAILED';
      deployment.updatedAt = new Date().toISOString();
      this.saveToDisk();
      const message =
        error instanceof Error ? error.message : String(error);
      await this.log(deploymentId, `Deployment failed: ${message}`);
      throw error;
    }
  }

  /*
   * -------------------------------------------------------------
   * PAUSE DEPLOYMENT (STOP TUNNEL -> PAUSE CONTAINER -> PAUSED)
   * -------------------------------------------------------------
   */
  async pause(
    deploymentId: string,
  ): Promise<DeploymentState> {
    const deployment =
      await this.get(deploymentId);

    if (
      deployment.status ===
      'PAUSED'
    ) {
      return deployment;
    }

    await this.log(
      deploymentId,
      'Stopping public tunnel...',
    );

    if (deployment.port) {
      this.tunnel.stop(
        deployment.port,
      );
    }

    if (deployment.containerId) {
      await this.log(
        deploymentId,
        'Pausing Docker container...',
      );

      await this.runtime.pauseContainer(
        deployment.containerId,
      );
    }

    deployment.status =
      'PAUSED';

    deployment.publicUrl =
      null;

    deployment.updatedAt =
      new Date().toISOString();

    await this.log(
      deploymentId,
      'Project paused',
    );

    this.saveToDisk();
    this.notifyRuntimeChanged();

    return deployment;
  }

  /*
   * -------------------------------------------------------------
   * RESUME DEPLOYMENT (RESUME CONTAINER -> HEALTH -> NEW TUNNEL -> READY)
   * -------------------------------------------------------------
   */
  async resume(
    deploymentId: string,
  ): Promise<DeploymentState> {
    const deployment =
      await this.get(deploymentId);

    if (
      deployment.status !==
      'PAUSED'
    ) {
      return deployment;
    }

    if (!deployment.containerId) {
      throw new Error(
        'Container ID missing',
      );
    }

    await this.log(
      deploymentId,
      'Resuming Docker container...',
    );

    const containerState =
      await this.runtime.getContainerState(
        deployment.containerId,
      );

    if (
      containerState === 'exited' ||
      containerState === 'created' ||
      containerState === 'dead' ||
      containerState === null
    ) {
      // The container was stopped rather than paused: start it again.
      await this.runtime.startContainer(
        deployment.containerId,
      );
    } else {
      await this.runtime.resumeContainer(
        deployment.containerId,
      );
    }

    await this.log(
      deploymentId,
      'Waiting for application...',
    );

    if (!deployment.port) {
      throw new Error(
        'Deployment port missing',
      );
    }

    const healthy =
      await this.runtime.waitForHealth(
        deployment.port,
        30000,
      );

    if (!healthy) {
      throw new Error(
        'Application did not become healthy',
      );
    }

    await this.log(
      deploymentId,
      'Application is healthy',
    );

    await this.log(
      deploymentId,
      'Creating new public URL...',
    );

    let publicUrl: string;
    try {
      publicUrl =
        await this.tunnel.start(
          deployment.port,
        );
    } catch (tunnelError: any) {
      deployment.status = 'FAILED';
      deployment.publicUrl = null;
      deployment.updatedAt = new Date().toISOString();
      this.saveToDisk();
      const errorMsg =
        tunnelError instanceof Error
          ? tunnelError.message
          : String(tunnelError);
      await this.log(
        deploymentId,
        `Cloudflare tunnel failed: ${errorMsg}`,
      );
      throw new Error(`Cloudflare tunnel failed: ${errorMsg}`);
    }

    if (!publicUrl || !publicUrl.includes('trycloudflare.com')) {
      deployment.status = 'FAILED';
      deployment.publicUrl = null;
      deployment.updatedAt = new Date().toISOString();
      this.saveToDisk();
      await this.log(
        deploymentId,
        'Cloudflare tunnel failed: No valid trycloudflare.com URL received',
      );
      throw new Error(
        'Cloudflare tunnel failed: No valid trycloudflare.com URL received',
      );
    }

    deployment.publicUrl =
      publicUrl;

    deployment.status =
      'READY';

    deployment.updatedAt =
      new Date().toISOString();

    await this.log(
      deploymentId,
      'New public URL created',
    );

    await this.log(
      deploymentId,
      'Deployment ready',
    );

    this.saveToDisk();
    this.notifyRuntimeChanged();

    return deployment;
  }

  async all(): Promise<DeploymentState[]> {
    // Always reconcile against Docker so an agent restart re-discovers
    // runtimes that are still up. Only DeployX-managed containers count.
    try {
      const containers =
        await this.runtime.listManagedContainers();

      for (const c of containers) {
        const key =
          c.deploymentId ||
          (c.projectId ? `project-${c.projectId}` : null);

        if (!key) {
          continue;
        }

        const existing = this.deployments.get(key);

        if (!existing) {
          this.deployments.set(key, {
            deploymentId: key,
            projectPath: '',
            containerId: c.containerId,
            containerName: c.containerName,
            port: c.port ?? null,
            status:
              c.state === 'paused' || c.state === 'exited'
                ? 'PAUSED'
                : 'RUNNING',
            publicUrl: null,
            projectId: c.projectId ?? null,
            userId: c.userId ?? null,
            projectName: c.projectName ?? null,
            logs: [
              `[${new Date().toLocaleTimeString()}] Discovered DeployX container: ${c.containerName} (${c.state})`,
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          continue;
        }

        existing.containerId = c.containerId;
        existing.containerName = c.containerName;
        existing.port = c.port ?? existing.port;
        existing.projectId = c.projectId ?? existing.projectId;
        existing.userId = c.userId ?? existing.userId;
        existing.projectName = c.projectName ?? existing.projectName;

        if (
          existing.status !== 'PAUSED' &&
          (c.state === 'paused' || c.state === 'exited')
        ) {
          existing.status = 'PAUSED';
          existing.publicUrl = null;
        } else if (
          existing.status === 'PAUSED' &&
          c.state === 'running'
        ) {
          existing.status = existing.publicUrl ? 'READY' : 'RUNNING';
        }

        existing.updatedAt = new Date().toISOString();
      }

      if (this.deployments.size > 0) {
        this.saveToDisk();
      }
    } catch {}

    return Array.from(
      this.deployments.values(),
    );
  }

  /**
   * Cancel an in-progress build/startup deployment.
   */
  async cancel(deploymentId: string): Promise<DeploymentState> {
    const deployment = await this.get(deploymentId);
    if (deployment.status !== 'BUILDING') {
      return deployment;
    }

    await this.log(deploymentId, 'Cancellation requested. Aborting build process...');

    if (deployment.port) {
      try {
        this.tunnel.stop(deployment.port);
      } catch {}
    }

    await this.runtime.cancelDeployment(deploymentId);

    if (deployment.containerId) {
      try {
        await this.runtime.stopRuntime(deployment.containerId);
      } catch {}
    }

    deployment.status = 'FAILED';
    await this.log(deploymentId, 'Deployment was cancelled.');
    deployment.updatedAt = new Date().toISOString();
    this.saveToDisk();
    this.notifyRuntimeChanged();

    return deployment;
  }

  /**
   * Delete means delete: stop this deployment's tunnel, remove its Docker
   * container and delete the extracted project files.
   */
  async remove(deploymentId: string) {
    let deployment: DeploymentState | null = null;
    try {
      deployment = await this.get(deploymentId);
    } catch {}

    // Also drop any tracked entry for this project (project-level delete).
    for (const [key, value] of this.deployments.entries()) {
      if (
        key !== deploymentId &&
        deployment?.projectId &&
        value.projectId === deployment.projectId
      ) {
        deployment = deployment ?? value;
        this.deployments.delete(key);
      }
    }

    if (deployment) {
      if (deployment.port) {
        try {
          this.tunnel.stop(deployment.port);
        } catch {}
      }

      if (deployment.containerId) {
        try {
          // stopRuntime stops *and removes* the container.
          await this.runtime.stopRuntime(deployment.containerId);
        } catch {}
      }

      this.deployments.delete(deploymentId);

      // Remove the extracted runtime files for this project only.
      const removedPath = this.removeProjectFiles(deployment.projectPath);

      this.saveToDisk();
      this.notifyRuntimeChanged();

      return {
        success: true,
        deploymentId,
        containerRemoved: !!deployment.containerId,
        projectFilesRemoved: removedPath,
        message: 'Deployment runtime permanently removed (container + tunnel + files)',
      };
    }

    return {
      success: true,
      deploymentId,
      containerRemoved: false,
      projectFilesRemoved: null,
      message: 'No active runtime found for deployment',
    };
  }

  /**
   * Delete the extracted project directory, guarding against path traversal
   * and never touching directories outside the DeployX runtime roots.
   */
  private removeProjectFiles(projectPath?: string | null): string | null {
    if (!projectPath) return null;

    const allowedRoots = [
      path.resolve(process.cwd(), 'uploads'),
      path.resolve(process.cwd(), '..', 'runtime-projects'),
      path.resolve(process.cwd(), '..', 'apps', 'api', 'uploads'),
      path.resolve(process.cwd(), '..', '..', 'runtime-projects'),
      path.resolve(process.cwd(), '..', '..', 'apps', 'api', 'uploads'),
      path.resolve(resolveAgentDataDir(), 'projects'),
    ].map((root) => path.resolve(root));

    let resolved: string;
    try {
      resolved = path.resolve(projectPath);
    } catch {
      return null;
    }

    const withinRoot = allowedRoots.some(
      (root) => resolved === root || resolved.startsWith(root + path.sep),
    );

    if (!withinRoot) return null;
    if (resolved.length < 8) return null; // never delete a drive root

    try {
      if (!fs.existsSync(resolved)) return null;
      fs.rmSync(resolved, { recursive: true, force: true });
      return resolved;
    } catch {
      return null;
    }
  }

  /** Let the pairing/sync layer push the new runtime state to the API. */
  setRuntimeChangeListener(listener?: () => void) {
    this.runtimeChangeListener = listener || undefined;
  }

  private notifyRuntimeChanged() {
    try {
      this.runtimeChangeListener?.();
    } catch {}
  }
}

