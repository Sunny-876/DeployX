import {
  BadRequestException,
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createHash, randomBytes, randomInt } from 'crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { containerStateToStatus } from '../deployments/runtime-status.js';

const PAIRING_TTL_MS = Number(process.env.AGENT_PAIRING_TTL_MS) || 10 * 60 * 1000;
export const HEARTBEAT_INTERVAL_MS = Number(process.env.AGENT_HEARTBEAT_INTERVAL_MS) || 15 * 1000;
export const OFFLINE_AFTER_MS = Number(process.env.AGENT_OFFLINE_AFTER_MS) || 45 * 1000;

/** A single DeployX-managed container as reported by an agent. */
export interface AgentContainerReport {
  containerId?: string;
  containerName?: string;
  /** Docker state: running | paused | exited | created | ... */
  state?: string;
  managed?: boolean;
  projectId?: string | null;
  userId?: string | null;
  deploymentId?: string | null;
  projectName?: string | null;
  port?: number | null;
  publicUrl?: string | null;
  projectPath?: string | null;
  missingMetadata?: string[];
}

export interface RuntimeReconcileReport {
  received: number;
  updated: number;
  recovered: number;
  offline: number;
  ignored: { containerId?: string; reason: string }[];
  unmatched: { containerId?: string; projectId?: string | null; deploymentId?: string | null; reason: string }[];
  missingMetadata: { containerId?: string; missing: string[] }[];
  dockerAvailable: boolean;
}

function sha256(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

function isOnline(lastSeenAt: Date | null): boolean {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() <= OFFLINE_AFTER_MS;
}

@Injectable()
export class AgentsService {
  constructor(private readonly prisma: PrismaService) {}

  async generatePairingCode(userId: string) {
    const code = String(randomInt(100000, 1000000));
    const codeHash = sha256(code);
    const expiresAt = new Date(Date.now() + PAIRING_TTL_MS);
    try {
      await this.prisma.agentPairing.create({
        data: { userId, codeHash, expiresAt },
      });
    } catch {
      throw new BadRequestException('Could not generate pairing code. Try again.');
    }
    return { code, expiresAt: expiresAt.toISOString() };
  }

  async claimPairing(data: { code?: string; name?: string; version?: string; hostname?: string }) {
    const code = (data?.code || '').trim();
    if (!/^\d{6}$/.test(code)) {
      throw new BadRequestException('A 6-digit pairing code is required');
    }
    const codeHash = sha256(code);
    // Atomically consume the pairing row: only one claim can win (single-use),
    // and only if not expired. updateMany returns count=0 when invalid/used/expired.
    const consumed = await this.prisma.agentPairing.updateMany({
      where: { codeHash, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (consumed.count !== 1) {
      throw new GoneException('Pairing code is invalid, expired, or already used');
    }
    const pairing = await this.prisma.agentPairing.findUnique({ where: { codeHash } });
    if (!pairing) {
      throw new GoneException('Pairing code is invalid, expired, or already used');
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = sha256(rawToken);
    const hostname = (data?.hostname || '').slice(0, 120) || null;
    const version = (data?.version || '').slice(0, 40) || null;
    const name = (data?.name || hostname || 'My PC').slice(0, 120);

    // Reuse an existing live agent for this user+hostname when possible (restart-safe),
    // otherwise create a new agent record. Never store raw token in DB.
    // Hostname may be null (unknown), so handle it explicitly: null cannot use `undefined` filter.
    let agent = await this.prisma.agent.findFirst({
      where: hostname
        ? { userId: pairing.userId, hostname, revokedAt: null }
        : { userId: pairing.userId, hostname: null, revokedAt: null },
      orderBy: { updatedAt: 'desc' },
    });
    if (agent) {
      agent = await this.prisma.agent.update({
        where: { id: agent.id },
        data: { name, tokenHash, version, hostname, lastSeenAt: new Date(), status: 'ONLINE', revokedAt: null },
      });
    } else {
      agent = await this.prisma.agent.create({
        data: { userId: pairing.userId, name, tokenHash, version, hostname, lastSeenAt: new Date(), status: 'ONLINE' },
      });
    }
    return { agentId: agent.id, agentToken: rawToken, userId: pairing.userId };
  }

  /**
   * Heartbeat = "I am online" + the current runtime state of every
   * DeployX-managed container on this machine. The API mirrors that state into
   * the current deployment records so the dashboard always reflects Docker.
   */
  async heartbeat(
    agentId: string,
    userId: string,
    data: {
      version?: string;
      hostname?: string;
      status?: string;
      containers?: AgentContainerReport[];
      dockerAvailable?: boolean;
    },
  ) {
    const agent = await this.prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent || agent.revokedAt) {
      throw new NotFoundException('Agent not found or revoked');
    }
    if (agent.userId !== userId) {
      throw new ForbiddenException('Agent does not belong to this account');
    }

    const updated = await this.prisma.agent.update({
      where: { id: agent.id },
      data: {
        version: (data?.version || agent.version || '').slice(0, 40) || null,
        hostname: (data?.hostname || agent.hostname || '').slice(0, 120) || null,
        lastSeenAt: new Date(),
        status: 'ONLINE',
      },
      select: { id: true, name: true, version: true, hostname: true, lastSeenAt: true, status: true },
    });

    const runtime = Array.isArray(data?.containers)
      ? await this.reconcileRuntime(agent.id, userId, data.containers, data?.dockerAvailable !== false)
      : null;

    return { ...updated, runtime };
  }

  /**
   * Explicit runtime synchronization (`POST /agents/sync`).
   * The agent pushes the full current runtime picture; only the authenticated
   * agent's own account is ever touched.
   */
  async syncRuntime(
    agentId: string,
    userId: string,
    payload: {
      version?: string;
      hostname?: string;
      status?: string;
      dockerAvailable?: boolean;
      containers?: AgentContainerReport[];
      unmanaged?: AgentContainerReport[];
    },
  ) {
    const agent = await this.prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent || agent.revokedAt) {
      throw new NotFoundException('Agent not found or revoked');
    }
    if (agent.userId !== userId) {
      throw new ForbiddenException('Agent does not belong to this account');
    }

    await this.prisma.agent.update({
      where: { id: agent.id },
      data: {
        version: (payload?.version || agent.version || '').slice(0, 40) || null,
        hostname: (payload?.hostname || agent.hostname || '').slice(0, 120) || null,
        lastSeenAt: new Date(),
        status: 'ONLINE',
      },
    });

    const report = await this.reconcileRuntime(
      agent.id,
      userId,
      Array.isArray(payload?.containers) ? payload.containers : [],
      payload?.dockerAvailable !== false,
    );

    // Containers Docker owns but that are not claimed by DeployX are reported,
    // never adopted (security: com.deployx.managed=true is required).
    for (const container of payload?.unmanaged || []) {
      report.ignored.push({
        containerId: container?.containerId,
        reason: 'unmanaged container ignored (missing com.deployx.managed=true label)',
      });
    }

    return { agentId: agent.id, syncedAt: new Date().toISOString(), ...report };
  }

  /**
   * Reconcile the agent's Docker view with the database.
   *
   * - Trusted metadata comes from Docker labels, not container names.
   * - Only containers with `com.deployx.managed=true` that belong to the
   *   authenticated agent's account are touched.
   * - A container that has enough metadata but no DB row is recovered/imported.
   * - A DB runtime that the agent no longer reports is marked OFFLINE.
   */
  async reconcileRuntime(
    agentId: string,
    userId: string,
    containers: AgentContainerReport[],
    dockerAvailable = true,
  ): Promise<RuntimeReconcileReport> {
    const report: RuntimeReconcileReport = {
      received: 0,
      updated: 0,
      recovered: 0,
      offline: 0,
      ignored: [],
      unmatched: [],
      missingMetadata: [],
      dockerAvailable,
    };

    const seenDeploymentIds = new Set<string>();
    const syncedAt = new Date();

    for (const raw of containers || []) {
      report.received++;
      const containerId = raw?.containerId || '';
      const state = raw?.state || null;

      if (raw?.managed !== true) {
        report.ignored.push({
          containerId,
          reason: 'unmanaged container ignored (missing com.deployx.managed=true label)',
        });
        continue;
      }

      if (Array.isArray(raw?.missingMetadata) && raw.missingMetadata.length > 0) {
        report.missingMetadata.push({ containerId, missing: raw.missingMetadata });
      }

      // Ownership: never let an agent claim another account's data.
      if (raw?.userId && raw.userId !== userId) {
        report.ignored.push({
          containerId,
          reason: 'container metadata belongs to a different DeployX account',
        });
        continue;
      }

      const status = containerStateToStatus(state, true);
      const publicUrl =
        status === 'RUNNING' && raw?.publicUrl && String(raw.publicUrl).includes('trycloudflare.com')
          ? String(raw.publicUrl)
          : null;
      const port = Number.isFinite(Number(raw?.port)) ? Number(raw.port) : null;

      // 1. Match an existing deployment (by agent deployment id first).
      let deployment = raw?.deploymentId
        ? await this.prisma.deployment.findFirst({
            where: { OR: [{ id: raw.deploymentId }, { commitHash: raw.deploymentId }] },
            include: { project: true },
            orderBy: { createdAt: 'desc' },
          })
        : null;

      if (deployment) {
        if (deployment.project?.userId !== userId) {
          report.ignored.push({ containerId, reason: 'deployment belongs to a different account' });
          continue;
        }

        await this.prisma.deployment.update({
          where: { id: deployment.id },
          data: {
            agentId,
            status,
            url: publicUrl,
            containerId: containerId || deployment.containerId,
            containerName: raw?.containerName || deployment.containerName,
            port: port ?? deployment.port,
            projectPath: raw?.projectPath || deployment.projectPath,
            lastSyncedAt: syncedAt,
          },
        });

        seenDeploymentIds.add(deployment.id);
        report.updated++;
        continue;
      }

      // 2. Recover an orphaned runtime when a project can be identified.
      const projectId = raw?.projectId || null;
      if (!projectId) {
        report.unmatched.push({
          containerId,
          projectId: null,
          deploymentId: raw?.deploymentId || null,
          reason: 'no matching deployment or project metadata',
        });
        continue;
      }

      const project = await this.prisma.project.findUnique({ where: { id: projectId } });
      if (!project || project.userId !== userId) {
        report.unmatched.push({
          containerId,
          projectId,
          deploymentId: raw?.deploymentId || null,
          reason: 'project not found for this account',
        });
        continue;
      }

      const projectAlreadyTracked = await this.prisma.deployment.findFirst({
        where: { projectId, containerId: { not: null } },
      });
      if (projectAlreadyTracked) {
        report.unmatched.push({
          containerId,
          projectId,
          deploymentId: raw?.deploymentId || null,
          reason: 'project already has a current runtime record',
        });
        continue;
      }

      const created = await this.prisma.deployment.create({
        data: {
          projectId,
          agentId,
          status,
          commitHash: raw?.deploymentId || null,
          containerId: containerId || null,
          containerName: raw?.containerName || null,
          port,
          projectPath: raw?.projectPath || null,
          url: publicUrl,
          lastSyncedAt: syncedAt,
        },
      });

      seenDeploymentIds.add(created.id);
      report.recovered++;

      await this.prisma.deploymentLog
        .create({
          data: {
            deploymentId: created.id,
            message: `Recovered runtime from Docker container ${raw?.containerName || containerId}`,
          },
        })
        .catch(() => {});
    }

    // 3. Anything we previously knew to be live but the agent no longer sees is OFFLINE.
    if (dockerAvailable) {
      const live = await this.prisma.deployment.findMany({
        where: {
          agentId,
          status: { in: ['RUNNING', 'READY', 'PAUSED'] },
          containerId: { not: null },
        },
      });

      for (const d of live) {
        if (seenDeploymentIds.has(d.id)) continue;
        await this.prisma.deployment.update({
          where: { id: d.id },
          data: { status: 'OFFLINE', url: null, lastSyncedAt: syncedAt },
        });
        report.offline++;
      }
    }

    return report;
  }

  async listForUser(userId: string) {
    const agents = await this.prisma.agent.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, name: true, status: true, version: true, hostname: true, lastSeenAt: true, createdAt: true, revokedAt: true },
    });
    return agents.map((a) => {
      const online = !a.revokedAt && isOnline(a.lastSeenAt);
      return {
        id: a.id,
        name: a.name,
        status: a.revokedAt ? 'OFFLINE' : online ? 'ONLINE' : 'OFFLINE',
        storedStatus: a.status,
        version: a.version,
        hostname: a.hostname,
        lastSeenAt: a.lastSeenAt,
        createdAt: a.createdAt,
        revoked: !!a.revokedAt,
      };
    });
  }

  async onlineAgentForUser(userId: string) {
    const agents = await this.prisma.agent.findMany({
      where: { userId, revokedAt: null },
      orderBy: { lastSeenAt: 'desc' },
    });
    return agents.find((a) => isOnline(a.lastSeenAt)) || null;
  }

  async revoke(agentId: string, userId: string) {
    const agent = await this.prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) throw new NotFoundException('Agent not found');
    if (agent.userId !== userId) throw new ForbiddenException('You do not own this agent');
    await this.prisma.agent.update({
      where: { id: agent.id },
      data: { revokedAt: new Date(), status: 'OFFLINE', tokenHash: `revoked:${agent.id}:${Date.now()}` },
    });
    return { success: true, id: agent.id };
  }

  async resolveAgentForDeployment(userId: string) {
    const agent = await this.onlineAgentForUser(userId);
    if (!agent) {
      throw new ServiceUnavailableException('Connect your DeployX Agent before deploying.');
    }
    return agent;
  }

  async queueCommand(params: {
    agentId: string;
    userId: string;
    type: 'DEPLOY' | 'PAUSE' | 'RESUME' | 'DELETE' | 'STATUS';
    payload?: any;
  }) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: params.agentId },
    });
    if (!agent || agent.revokedAt) {
      throw new NotFoundException('Agent not found or has been revoked');
    }
    if (agent.userId !== params.userId) {
      throw new ForbiddenException('Agent does not belong to your account');
    }

    return this.prisma.agentCommand.create({
      data: {
        agentId: params.agentId,
        userId: params.userId,
        type: params.type,
        status: 'PENDING',
        payload: params.payload ?? {},
      },
    });
  }

  async pollCommand(agentId: string, userId: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
    });
    if (!agent || agent.revokedAt) {
      throw new NotFoundException('Agent not found or revoked');
    }
    if (agent.userId !== userId) {
      throw new ForbiddenException('Agent does not belong to this account');
    }

    await this.prisma.agent.update({
      where: { id: agentId },
      data: { lastSeenAt: new Date(), status: 'ONLINE' },
    });

    const pending = await this.prisma.agentCommand.findFirst({
      where: { agentId, status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
    });

    if (!pending) {
      return { command: null };
    }

    const claimed = await this.prisma.agentCommand.update({
      where: { id: pending.id },
      data: {
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    return {
      command: {
        id: claimed.id,
        type: claimed.type,
        payload: claimed.payload,
        createdAt: claimed.createdAt,
      },
    };
  }

  async reportCommandResult(
    agentId: string,
    userId: string,
    commandId: string,
    data: {
      status: 'SUCCEEDED' | 'FAILED' | 'REJECTED';
      result?: any;
      error?: string;
    },
  ) {
    const command = await this.prisma.agentCommand.findUnique({
      where: { id: commandId },
    });
    if (!command) {
      throw new NotFoundException(`Command ${commandId} not found`);
    }
    if (command.agentId !== agentId) {
      throw new ForbiddenException('Command does not belong to this agent');
    }
    if (command.userId !== userId) {
      throw new ForbiddenException('Command does not belong to this account');
    }

    const updated = await this.prisma.agentCommand.update({
      where: { id: commandId },
      data: {
        status: data.status,
        result: data.result ?? null,
        error: data.error ?? null,
        completedAt: new Date(),
      },
    });

    const payload = (command.payload as any) || {};
    const deploymentId = payload.deploymentId;
    if (deploymentId) {
      const now = new Date();
      if (command.type === 'PAUSE' && data.status === 'SUCCEEDED') {
        await this.prisma.deployment.update({
          where: { id: deploymentId },
          data: { status: 'PAUSED', url: null, lastSyncedAt: now },
        }).catch(() => {});
        await this.prisma.deploymentLog.create({
          data: { deploymentId, message: 'Deployment paused by Agent' },
        }).catch(() => {});
      } else if (command.type === 'RESUME' && data.status === 'SUCCEEDED') {
        const publicUrl = data.result?.publicUrl || null;
        const port = data.result?.port ?? null;
        await this.prisma.deployment.update({
          where: { id: deploymentId },
          data: { status: 'RUNNING', url: publicUrl, port, lastSyncedAt: now },
        }).catch(() => {});
        await this.prisma.deploymentLog.create({
          data: { deploymentId, message: `Deployment resumed by Agent: ${publicUrl || 'local port ' + port}` },
        }).catch(() => {});
      } else if (command.type === 'DELETE' && data.status === 'SUCCEEDED') {
        await this.prisma.deployment.delete({
          where: { id: deploymentId },
        }).catch(() => {});
      } else if (command.type === 'DEPLOY') {
        if (data.status === 'SUCCEEDED') {
          const publicUrl = data.result?.publicUrl || null;
          const port = data.result?.port ?? null;
          const containerId = data.result?.containerId || null;
          await this.prisma.deployment.update({
            where: { id: deploymentId },
            data: {
              status: 'RUNNING',
              url: publicUrl,
              port,
              containerId,
              lastSyncedAt: now,
            },
          }).catch(() => {});
          await this.prisma.deploymentLog.create({
            data: { deploymentId, message: `Agent deployment ready: ${publicUrl || ''}` },
          }).catch(() => {});
        } else {
          await this.prisma.deployment.update({
            where: { id: deploymentId },
            data: { status: 'FAILED', lastSyncedAt: now },
          }).catch(() => {});
          await this.prisma.deploymentLog.create({
            data: { deploymentId, message: `Agent deployment failed: ${data.error || 'Unknown error'}` },
          }).catch(() => {});
        }
      }
    }

    return updated;
  }

  async queueAndAwaitCommand(
    agentId: string,
    userId: string,
    type: 'DEPLOY' | 'PAUSE' | 'RESUME' | 'DELETE' | 'STATUS',
    payload: any,
    timeoutMs = 8000,
  ) {
    const cmd = await this.queueCommand({ agentId, userId, type, payload });
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      const latest = await this.prisma.agentCommand.findUnique({
        where: { id: cmd.id },
      });
      if (latest && (latest.status === 'SUCCEEDED' || latest.status === 'FAILED' || latest.status === 'REJECTED')) {
        return latest;
      }
    }

    return cmd;
  }
}
