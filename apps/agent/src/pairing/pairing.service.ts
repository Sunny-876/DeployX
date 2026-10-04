import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as os from 'os';
import { clearIdentity, loadIdentity, resolveAgentDataDir, saveIdentity } from './agent-identity.store';
import { RuntimeService } from '../runtime/runtime.service';
import { DeploymentManagerService } from '../deployment/deployment-manager.service';
import { resolveApiUrl } from '../config/agent-config';

@Injectable()
export class PairingService implements OnModuleInit {
  private readonly logger = new Logger('PairingService');
  private readonly apiUrl = resolveApiUrl();
  private readonly version = '0.1.0';
  private timer: NodeJS.Timeout | null = null;
  private syncing = false;

  constructor(
    private readonly runtime: RuntimeService,
    private readonly manager: DeploymentManagerService,
  ) {}

  async onModuleInit() {
    this.logger.log(`Agent data dir: ${resolveAgentDataDir()}`);

    // Push runtime changes (deploy / pause / resume / delete) to the API right
    // away so the dashboard never lags behind Docker.
    this.manager.setRuntimeChangeListener(() => {
      void this.syncRuntime().catch(() => {});
    });

    this.startHeartbeatLoop();
    this.startCommandPollLoop();
  }

  private identity() {
    return loadIdentity();
  }

  async getStatus() {
    const identity = this.identity();
    let dockerConnected = false;
    try {
      const dockerStatus = await this.runtime.status();
      dockerConnected = !!dockerStatus?.connected;
    } catch {
      dockerConnected = false;
    }

    let projectsCount = 0;
    try {
      const states = await this.manager.all();
      const uniqueProjects = new Set(
        states.map((s: any) => s.projectId || s.projectName).filter(Boolean),
      );
      projectsCount = uniqueProjects.size || (states.length > 0 ? 1 : 0);
    } catch {
      projectsCount = 0;
    }

    return {
      paired: !!identity,
      agentId: identity?.agentId || null,
      name: identity?.name || os.hostname(),
      hostname: os.hostname(),
      apiUrl: identity?.apiUrl || this.apiUrl,
      dockerReady: dockerConnected,
      account: identity ? 'Connected' : 'Not connected',
      projects: projectsCount,
      dataDir: resolveAgentDataDir(),
      heartbeatIntervalMs: Number(process.env.AGENT_HEARTBEAT_INTERVAL_MS) || 15000,
    };
  }

  unpair() {
    clearIdentity();
    return { success: true, message: 'Agent unpaired successfully' };
  }

  async pairWithCode(code: string, name?: string) {
    const cleaned = (code || '').trim();
    if (!/^\d{6}$/.test(cleaned)) {
      throw new Error('A 6-digit pairing code is required');
    }
    const response = await fetch(`${this.apiUrl}/agent/pair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: cleaned,
        name: name || os.hostname(),
        hostname: os.hostname(),
        version: this.version,
      }),
      signal: AbortSignal.timeout(15000),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.message || 'Pairing failed. Check the code and try again.');
    }
    const file = saveIdentity({
      agentId: data.agentId,
      agentToken: data.agentToken,
      apiUrl: this.apiUrl,
      userId: data.userId,
      name: name || os.hostname(),
      pairedAt: new Date().toISOString(),
    });
    await this.sendHeartbeat(true).catch(() => {});
    await this.syncRuntime().catch(() => {});
    return { agentId: data.agentId, file, apiUrl: this.apiUrl };
  }

  /**
   * Merge Docker (authoritative for running state) with the agent's own
   * deployment store (authoritative for the tunnel/public URL) into the payload
   * that is pushed to the API on every heartbeat and explicit sync.
   */
  private async collectRuntimePayload() {
    const runtime = await this.runtime.managedRuntime();

    let states: any[] = [];
    try {
      states = await this.manager.all();
    } catch {
      states = [];
    }

    const stateByContainer = new Map<string, any>();
    const stateByProject = new Map<string, any>();
    const stateByDeployment = new Map<string, any>();
    for (const state of states) {
      if (state?.containerId) stateByContainer.set(String(state.containerId), state);
      if (state?.projectId) stateByProject.set(String(state.projectId), state);
      if (state?.deploymentId) stateByDeployment.set(String(state.deploymentId), state);
    }

    const containers = runtime.containers.map((container: any) => {
      const state =
        stateByContainer.get(String(container.containerId)) ||
        (container.projectId ? stateByProject.get(String(container.projectId)) : null) ||
        (container.deploymentId ? stateByDeployment.get(String(container.deploymentId)) : null) ||
        null;

      const tunnelUrl =
        state?.publicUrl && String(state.publicUrl).includes('trycloudflare.com')
          ? String(state.publicUrl)
          : null;

      return {
        containerId: container.containerId,
        containerName: container.containerName,
        state: container.state,
        managed: true,
        projectId: container.projectId ?? state?.projectId ?? null,
        userId: container.userId ?? state?.userId ?? null,
        deploymentId: container.deploymentId ?? state?.deploymentId ?? null,
        projectName: container.projectName ?? state?.projectName ?? null,
        port: container.port ?? state?.port ?? null,
        publicUrl: tunnelUrl,
        projectPath: state?.projectPath || null,
        missingMetadata: container.missingMetadata || [],
      };
    });

    return {
      version: this.version,
      hostname: os.hostname(),
      status: 'ONLINE',
      dockerAvailable: runtime.dockerAvailable,
      containers,
      unmanaged: runtime.unmanaged.map((container: any) => ({
        containerId: container.containerId,
        containerName: container.containerName,
        image: container.image,
        state: container.state,
        managed: false,
      })),
    };
  }

  /**
   * Push the full current runtime state to the API (`POST /agents/sync`).
   * Used at startup (startup reconciliation) and after every runtime change.
   */
  async syncRuntime(now = false) {
    const identity = this.identity();
    if (!identity) return { paired: false };
    if (this.syncing) return { paired: true, sync: 'in-progress' };

    this.syncing = true;

    try {
      const payload = await this.collectRuntimePayload();

      const response = await fetch(`${this.apiUrl}/agents/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${identity.agentToken}`,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      });

      if (response.status === 401) {
        this.logger.warn('Runtime sync rejected (revoked agent?).');
        return { paired: true, sync: 'rejected' };
      }

      if (!response.ok) {
        if (now) throw new Error(`Runtime sync failed with ${response.status}`);
        return { paired: true, sync: 'failed', status: response.status };
      }

      const report = await response.json().catch(() => ({}));

      if (report?.recovered > 0) {
        this.logger.log(`Recovered ${report.recovered} runtime(s) from Docker`);
      }
      if (report?.offline > 0) {
        this.logger.log(`${report.offline} runtime(s) marked OFFLINE`);
      }
      if ((report?.ignored || []).length > 0) {
        this.logger.log(
          `Ignored ${report.ignored.length} unmanaged container(s)`,
        );
      }

      return { paired: true, sync: 'ok', ...report };
    } catch (err) {
      if (now) throw err instanceof Error ? err : new Error('Runtime sync failed');
      return { paired: true, sync: 'offline' };
    } finally {
      this.syncing = false;
    }
  }

  async sendHeartbeat(now = false) {
    const identity = this.identity();
    if (!identity) return { paired: false };
    try {
      // The heartbeat carries the runtime state, so Docker and the dashboard
      // stay in sync without waiting for a separate sync cycle.
      const payload = await this.collectRuntimePayload();

      const response = await fetch(`${this.apiUrl}/agents/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${identity.agentToken}`,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      });
      if (response.status === 401) {
        this.logger.warn('Agent credential rejected (revoked?). Unpair and pair again.');
        return { paired: true, heartbeat: 'rejected' };
      }
      if (!response.ok) {
        if (now) throw new Error(`Heartbeat failed with ${response.status}`);
        return { paired: true, heartbeat: 'failed' };
      }
      return { paired: true, heartbeat: 'ok', ...(await response.json().catch(() => ({}))) };
    } catch (err) {
      if (now) throw err instanceof Error ? err : new Error('Heartbeat failed');
      return { paired: true, heartbeat: 'offline' };
    }
  }

  private startHeartbeatLoop() {
    const intervalMs = Number(process.env.AGENT_HEARTBEAT_INTERVAL_MS) || 15000;
    if (this.timer) clearInterval(this.timer);
    // First heartbeat shortly after boot so restarts flip ONLINE without re-pairing.
    // The same cycle performs startup reconciliation: running DeployX containers
    // are re-discovered in Docker and pushed to the API.
    setTimeout(() => {
      void this.sendHeartbeat(false);
      void this.syncRuntime().catch(() => {});
    }, 2000);
    this.timer = setInterval(() => void this.sendHeartbeat(false), intervalMs);
    if (typeof this.timer.unref === 'function') this.timer.unref();
  }

  private commandPollTimer: NodeJS.Timeout | null = null;

  private startCommandPollLoop() {
    if (this.commandPollTimer) clearInterval(this.commandPollTimer);
    setTimeout(() => {
      void this.pollAndExecuteCommands();
    }, 1500);
    this.commandPollTimer = setInterval(() => void this.pollAndExecuteCommands(), 3000);
    if (typeof this.commandPollTimer.unref === 'function') this.commandPollTimer.unref();
  }

  private async pollAndExecuteCommands() {
    const identity = this.identity();
    if (!identity?.agentToken) return;

    try {
      const response = await fetch(`${this.apiUrl}/agents/commands/poll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${identity.agentToken}`,
        },
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) return;

      const data = await response.json().catch(() => null);
      const command = data?.command;
      if (!command) return;

      this.logger.log(`Received command ${command.type} (id: ${command.id})`);
      await this.executeCommand(command, identity.agentToken);
    } catch {
      // transient network or API unavailable, silently poll again next interval
    }
  }

  private async executeCommand(
    command: { id: string; type: string; payload: any },
    agentToken: string,
  ) {
    let status: 'SUCCEEDED' | 'FAILED' = 'SUCCEEDED';
    let result: any = null;
    let error: string | undefined;

    try {
      const payload = command.payload || {};
      const deploymentId = payload.deploymentId || payload.agentDeploymentId;

      switch (command.type) {
        case 'PAUSE': {
          if (!deploymentId) throw new Error('deploymentId required for PAUSE');
          result = await this.manager.pause(deploymentId);
          break;
        }
        case 'RESUME': {
          if (!deploymentId) throw new Error('deploymentId required for RESUME');
          result = await this.manager.resume(deploymentId);
          break;
        }
        case 'DELETE': {
          if (!deploymentId) throw new Error('deploymentId required for DELETE');
          result = await this.manager.remove(deploymentId);
          break;
        }
        case 'STATUS': {
          result = await this.runtime.status();
          break;
        }
        case 'DEPLOY': {
          const deployId = payload.deploymentId || payload.id || `deploy-${Date.now()}`;
          const projPath = payload.projectPath || '.';
          result = await this.manager.deploy(deployId, projPath, {
            projectId: payload.projectId,
            userId: payload.userId,
            projectName: payload.projectName,
          });
          break;
        }
        default: {
          throw new Error(`Unsupported command type: ${command.type}`);
        }
      }
    } catch (err: any) {
      status = 'FAILED';
      error = err instanceof Error ? err.message : String(err);
      this.logger.error(`Command ${command.id} (${command.type}) failed: ${error}`);
    }

    try {
      await fetch(`${this.apiUrl}/agents/commands/${command.id}/result`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${agentToken}`,
        },
        body: JSON.stringify({ status, result, error }),
        signal: AbortSignal.timeout(10000),
      });
      this.logger.log(`Reported result for command ${command.id}: ${status}`);
    } catch (err) {
      this.logger.error(`Failed to report result for command ${command.id}: ${err}`);
    }

    void this.syncRuntime().catch(() => {});
  }
}
