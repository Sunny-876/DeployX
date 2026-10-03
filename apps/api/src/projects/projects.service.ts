import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service.js';
import { AgentService } from '../agent/agent.service.js';
import { containerStateToStatus, displayStatus } from '../deployments/runtime-status.js';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly agent: AgentService,
  ) {}

  async create(data: {
    name: string;
    slug: string;
    framework?: string;
    repository?: string;
    branch?: string;
    userId: string;
  }) {
    return this.prisma.project.create({
      data,
    });
  }

  /**
   * The dashboard's projects list: one entry per *current* project with its
   * current runtime state (mirrored from the agent + overlaid live).
   */
  async findAll(userId: string) {
    const projects = await this.prisma.project.findMany({
      where: {
        userId,
      },
      include: {
        deployments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const live = await this.agent.getManagedRuntime();
    const liveByKey = new Map<string, any>();
    for (const container of live.containers) {
      if (container?.deploymentId) liveByKey.set(String(container.deploymentId), container);
      if (container?.projectId) liveByKey.set(`project:${container.projectId}`, container);
    }

    return projects.map((project) => {
      const current = project.deployments[0] || null;
      const liveMatch =
        (current ? liveByKey.get(current.commitHash || current.id) : null) ||
        liveByKey.get(`project:${project.id}`) ||
        null;

      return {
        ...this.presentProject(project, current, liveMatch, live.dockerAvailable),
      };
    });
  }

  /**
   * Build the current-state projection for one project.
   *
   * Docker is the source of truth: when the agent is reachable and reports no
   * container for a deployment that we expected to be live, the project is
   * shown OFFLINE instead of pretending it is RUNNING.
   */
  private presentProject(
    project: any,
    current: any,
    liveMatch: any,
    dockerAvailable = false,
  ) {
    const liveStatus = liveMatch?.state ? containerStateToStatus(liveMatch.state, true) : null;

    let status = liveStatus || (current ? displayStatus(current.status) : 'NOT_DEPLOYED');

    const expectsContainer = !!current && (!!current.agentId || !!current.containerId);
    if (
      !liveStatus &&
      dockerAvailable &&
      expectsContainer &&
      (status === 'RUNNING' || status === 'PAUSED')
    ) {
      status = 'OFFLINE';
    }

    const url = status === 'RUNNING' ? liveMatch?.publicUrl ?? current?.url ?? null : null;
    const port = liveMatch?.port ?? current?.port ?? null;
    const containerId = liveMatch?.containerId ?? current?.containerId ?? null;

    const deployment = current
      ? {
          id: current.id,
          projectId: current.projectId,
          projectName: project.name,
          status,
          url,
          port,
          containerId,
          containerName: liveMatch?.containerName ?? current.containerName ?? null,
          agentDeploymentId: current.commitHash || current.id,
          lastSyncedAt: current.lastSyncedAt,
          createdAt: current.createdAt,
          updatedAt: current.updatedAt,
        }
      : null;

    return {
      id: project.id,
      name: project.name,
      slug: project.slug,
      framework: project.framework,
      repository: project.repository ?? null,
      branch: project.branch,
      createdAt: project.createdAt,
      updatedAt: deployment?.updatedAt || project.updatedAt,
      status,
      url,
      port,
      containerId,
      deploymentId: deployment?.id || null,
      deployment,
      // Backwards-compatible aliases (current state only, never history).
      latestDeployment: deployment,
      deployments: deployment ? [deployment] : [],
    };
  }

  async findOne(id: string, userId: string) {
    let project = await this.prisma.project.findFirst({
      where: {
        id,
      },
      include: {
        deployments: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!project) {
      project = await this.prisma.project.findFirst({
        where: {
          slug: id,
        },
        include: {
          deployments: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });
    }

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('You do not have access to this project');
    }

    const current = project.deployments[0] || null;

    const live = await this.agent.getManagedRuntime();
    const liveMatch =
      live.containers.find(
        (c: any) =>
          (current && (c?.deploymentId === current.commitHash || c?.deploymentId === current.id)) ||
          c?.projectId === project.id,
      ) || null;

    return {
      ...this.presentProject(project, current, liveMatch, live.dockerAvailable),
    };
  }

  /**
   * Hard delete: stop the tunnel, remove the Docker container, delete the
   * extracted project files and finally drop the project + deployment rows.
   * There is no trash / recycle bin / soft-delete state in DeployX.
   */
  async delete(id: string, userId: string) {
    let project = await this.prisma.project.findFirst({
      where: { id },
      include: { deployments: true },
    });

    if (!project) {
      project = await this.prisma.project.findFirst({
        where: { slug: id },
        include: { deployments: true },
      });
    }

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.userId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this project');
    }

    const cleanup: string[] = [];

    for (const deployment of project.deployments) {
      // 1. Stop tunnel + remove container + delete extracted runtime files.
      try {
        await this.agent.deleteDeployment(deployment.commitHash || deployment.id);
        cleanup.push(`agent runtime cleanup requested for ${deployment.commitHash || deployment.id}`);
      } catch {}

      // 2. Drop stored build artifacts for this deployment, if any.
      try {
        const storagePath = path.resolve(process.cwd(), 'storage', deployment.id);
        if (fs.existsSync(storagePath)) {
          fs.rmSync(storagePath, { recursive: true, force: true });
        }
      } catch {}
    }

    // 3. Delete the project. Deployments + logs cascade; nothing is retained.
    await this.prisma.project.delete({
      where: { id: project.id },
    });

    return {
      success: true,
      deleted: true,
      projectId: project.id,
      projectName: project.name,
      deploymentsRemoved: project.deployments.length,
      cleanup,
      message: 'Project and its runtime were permanently deleted',
    };
  }
}