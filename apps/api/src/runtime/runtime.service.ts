import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AgentService } from '../agent/agent.service.js';
import { containerStateToStatus, displayStatus } from '../deployments/runtime-status.js';

/**
 * Current-state runtime view for the dashboard.
 *
 * One project owns at most one *current* deployment/runtime record; DeployX
 * keeps no deployment history. The database is the mirror of the agent's
 * Docker state (written by POST /agents/sync + heartbeats); on read we also
 * overlay the agent's live view so the dashboard matches Docker immediately.
 */
@Injectable()
export class RuntimeService {
  private readonly logger = new Logger(RuntimeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly agent: AgentService,
  ) {}

  async snapshot(userId: string) {
    const projects = await this.prisma.project.findMany({
      where: { userId },
      include: {
        deployments: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Best-effort live overlay (agent may be offline / Docker may be down).
    const live = await this.agent.getManagedRuntime();

    const liveByDeployment = new Map<string, any>();
    const liveByProject = new Map<string, any>();
    for (const container of live.containers) {
      if (container?.deploymentId) {
        liveByDeployment.set(String(container.deploymentId), container);
      }
      if (container?.projectId && !liveByProject.has(String(container.projectId))) {
        liveByProject.set(String(container.projectId), container);
      }
    }

    const items = projects.map((project) => {
      const current = project.deployments[0] || null;
      const deploymentKey = current ? current.commitHash || current.id : null;
      const liveMatch =
        (deploymentKey ? liveByDeployment.get(deploymentKey) : null) ||
        (current ? liveByDeployment.get(current.id) : null) ||
        liveByProject.get(project.id) ||
        null;

      const liveStatus = liveMatch?.state ? containerStateToStatus(liveMatch.state, true) : null;

      // Live Docker state always wins; otherwise fall back to the last synced DB state.
      let status = liveStatus || (current ? displayStatus(current.status) : 'NOT_DEPLOYED');

      // The agent is reachable and Docker has no such container: do not pretend
      // the project is still RUNNING (spec: missing runtime => OFFLINE).
      const expectsContainer = !!current && (!!current.agentId || !!current.containerId);
      if (
        !liveStatus &&
        live.dockerAvailable &&
        expectsContainer &&
        (status === 'RUNNING' || status === 'PAUSED')
      ) {
        status = 'OFFLINE';
      }

      const url =
        status === 'RUNNING'
          ? (liveMatch?.publicUrl ?? current?.url ?? null)
          : null;

      const port = liveMatch?.port ?? current?.port ?? null;
      const containerId = liveMatch?.containerId ?? current?.containerId ?? null;

      return {
        id: project.id,
        name: project.name,
        slug: project.slug,
        framework: project.framework,
        branch: project.branch,
        createdAt: project.createdAt,
        updatedAt: current?.updatedAt || project.updatedAt,
        status,
        url,
        port,
        containerId,
        containerName: liveMatch?.containerName ?? current?.containerName ?? null,
        deploymentId: current?.id || null,
        agentDeploymentId: current?.commitHash || current?.id || null,
        lastSyncedAt: current?.lastSyncedAt || null,
        live: !!liveMatch,
      };
    });

    const countByStatus = (status: string) =>
      items.filter((item) => item.status === status).length;

    const deployments = items.filter((item) => !!item.deploymentId);

    return {
      counters: {
        projects: items.length,
        deployments: deployments.length,
        active: countByStatus('RUNNING'),
        paused: countByStatus('PAUSED'),
        offline: countByStatus('OFFLINE'),
        building: countByStatus('BUILDING'),
        failed: countByStatus('FAILED'),
      },
      runtime: {
        dockerAvailable: live.dockerAvailable,
        managedContainers: live.containers.length,
        unmanagedContainers: live.unmanaged.length,
      },
      projects: items,
      deployments,
      generatedAt: new Date().toISOString(),
    };
  }
}
