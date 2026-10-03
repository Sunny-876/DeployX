import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

import { PrismaService } from '../prisma/prisma.service.js';
import { BuilderService } from '../builder/builder.service.js';
import { ArtifactService } from '../artifacts/artifact.service.js';
import { AgentService } from '../agent/agent.service.js';
import { AgentsService } from '../agents/agents.service.js';
import {
  containerStateToStatus,
  displayStatus,
  toRuntimeStatus,
} from './runtime-status.js';

@Injectable()
export class DeploymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly builder: BuilderService,
    private readonly artifacts: ArtifactService,
    private readonly agent: AgentService,
    private readonly agents: AgentsService,
  ) {}

  async create(projectId: string, userId?: string) {
    const project = await this.prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (userId && project.userId !== userId) {
      throw new ForbiddenException('You do not have access to this project');
    }

    // Ownership-checked agent routing: never deploy without the user's own ONLINE agent.
    let agentId: string | undefined;
    if (userId) {
      const onlineAgent = await this.agents.resolveAgentForDeployment(userId);
      if (onlineAgent.userId !== project.userId) {
        throw new ForbiddenException('Agent does not belong to this project owner');
      }
      agentId = onlineAgent.id;
    }

    const deployment = await this.prisma.deployment.create({
      data: {
        projectId,
        agentId,
        status: 'QUEUED',
      },
    });

    return deployment;
  }

  private resolveBuildPath(
    projectPath: string,
    outputDirectory?: string,
  ): string {
    if (outputDirectory && outputDirectory !== '.') {
      const explicit = path.join(projectPath, outputDirectory);
      if (fs.existsSync(explicit)) {
        return explicit;
      }
    }

    const distPath = path.join(projectPath, 'dist');
    if (fs.existsSync(distPath) && fs.statSync(distPath).isDirectory()) {
      return distPath;
    }

    if (fs.existsSync(path.join(projectPath, 'index.html'))) {
      return projectPath;
    }

    // Check immediate subdirectories (e.g. when zip contained a root folder)
    try {
      const entries = fs.readdirSync(projectPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const subDir = path.join(projectPath, entry.name);
          if (outputDirectory && outputDirectory !== '.') {
            const subExplicit = path.join(subDir, outputDirectory);
            if (fs.existsSync(subExplicit)) return subExplicit;
          }
          const subDist = path.join(subDir, 'dist');
          if (fs.existsSync(subDist) && fs.statSync(subDist).isDirectory()) {
            return subDist;
          }
          if (fs.existsSync(path.join(subDir, 'index.html'))) {
            return subDir;
          }
        }
      }
    } catch {}

    const searchForIndex = (dir: string, depth = 0): string | null => {
      if (depth > 4) return null;
      try {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
          if (item.isFile() && item.name.toLowerCase() === 'index.html') {
            return dir;
          }
        }
        for (const item of items) {
          if (item.isDirectory() && !['node_modules', '.git'].includes(item.name)) {
            const found = searchForIndex(path.join(dir, item.name), depth + 1);
            if (found) return found;
          }
        }
      } catch {}
      return null;
    };

    const foundDir = searchForIndex(projectPath);
    if (foundDir) {
      return foundDir;
    }

    return projectPath;
  }

  async build(
    deploymentId: string,
    projectPath: string,
    buildCommand: string | null = 'npm run build',
    outputDirectory = '.',
    userId?: string,
  ) {
    if (!projectPath) {
      throw new BadRequestException('projectPath is required');
    }

    let deployment =
      await this.prisma.deployment.findUnique({
        where: {
          id: deploymentId,
        },
        include: {
          project: true,
        },
      });

    if (!deployment) {
      const project = await this.prisma.project.findUnique({
        where: {
          id: deploymentId,
        },
      });

      if (project) {
        const existing = await this.prisma.deployment.findFirst({
          where: {
            projectId: project.id,
            status: 'QUEUED',
          },
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            project: true,
          },
        });

        deployment =
          existing ||
          (await this.prisma.deployment.create({
            data: {
              projectId: project.id,
              status: 'QUEUED',
            },
            include: {
              project: true,
            },
          }));
      }
    }

    if (!deployment) {
      throw new NotFoundException(
        'Deployment not found',
      );
    }

    if (userId && deployment.project && deployment.project.userId !== userId) {
      throw new ForbiddenException('You do not have access to this deployment');
    }

    await this.prisma.deployment.update({
      where: {
        id: deployment.id,
      },
      data: {
        status: 'BUILDING',
      },
    });

    await this.prisma.deploymentLog.create({
      data: {
        deploymentId: deployment.id,
        message: 'Build started',
      },
    });

    const isStatic =
      !buildCommand ||
      deployment.project?.framework === 'static';

    let result: {
      success: boolean;
      stdout?: string;
      stderr?: string;
      error?: string;
    };

    if (isStatic) {
      result = {
        success: true,
        stdout: 'Static deployment ready',
      };
    } else {
      result = await this.builder.buildProject(
        projectPath,
        buildCommand,
      );
    }

    if (result.success) {
      const buildPath = this.resolveBuildPath(
        projectPath,
        outputDirectory,
      );

      await this.artifacts.storeDeployment(
        deployment.id,
        buildPath,
      );

      if (deploymentId !== deployment.id) {
        await this.artifacts.storeDeployment(
          deploymentId,
          buildPath,
        );
      }

      const deploymentUrl =
        `http://localhost:4000/sites/${deployment.id}`;

      await this.prisma.deployment.update({
        where: {
          id: deployment.id,
        },
        data: {
          status: 'READY',
          url: deploymentUrl,
        },
      });

      await this.prisma.deploymentLog.create({
        data: {
          deploymentId: deployment.id,
          message:
            result.stdout ||
            'Build completed successfully',
        },
      });

      return {
        success: true,
        status: 'READY',
        deploymentId: deployment.id,
        url: deploymentUrl,
      };
    }

    await this.prisma.deployment.update({
      where: {
        id: deployment.id,
      },
      data: {
        status: 'FAILED',
      },
    });

    await this.prisma.deploymentLog.create({
      data: {
        deploymentId: deployment.id,
        message:
          result.error ||
          'Build failed',
      },
    });

    return {
      success: false,
      status: 'FAILED',
      deploymentId: deployment.id,
      error: result.error,
    };
  }

  async findAll(projectId: string, userId?: string) {
    if (userId) {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
      });
      if (!project) {
        throw new NotFoundException('Project not found');
      }
      if (project.userId !== userId) {
        throw new ForbiddenException('You do not have access to this project');
      }
    }

    // Current state only — the newest deployment for the project.
    const deployment = await this.prisma.deployment.findFirst({
      where: {
        projectId,
      },
      include: {
        logs: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return deployment ? [deployment] : [];
  }

  async findOne(id: string, userId?: string) {
    return this.getDeploymentDetails(id, userId);
  }

  async getDeploymentDetails(id: string, userId?: string) {
    let deployment = await this.prisma.deployment.findUnique({
      where: { id },
      include: { project: true, logs: true },
    });

    if (!deployment) {
      deployment = await this.prisma.deployment.findFirst({
        where: { projectId: id },
        include: { project: true, logs: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!deployment) {
      throw new NotFoundException(`Deployment ${id} not found`);
    }

    if (userId && deployment.project && deployment.project.userId !== userId) {
      throw new ForbiddenException('You do not have access to this deployment');
    }

    const agentDeploymentId = deployment.commitHash || deployment.id;

    const live = await this.agent.getManagedRuntime();
    const presented = this.presentDeployment(
      deployment,
      this.indexLiveRuntime(live.containers),
      live.dockerAvailable,
    );

    // Live logs come straight from the running runtime when it exists.
    let agentLogs: string[] = [];
    try {
      const agentState = await this.agent.getDeployment(agentDeploymentId);
      if (Array.isArray(agentState?.logs) && agentState.logs.length > 0) {
        agentLogs = agentState.logs;
      }
    } catch {}

    return {
      ...presented,
      agentDeploymentId,
      logs: agentLogs.length > 0 ? agentLogs : deployment.logs.map((l) => l.message),
      project: deployment.project,
      projectPath: deployment.projectPath,
      createdAt: deployment.createdAt,
      updatedAt: deployment.updatedAt,
    };
  }

  async getDeploymentLogs(id: string, userId?: string) {
    const details = await this.getDeploymentDetails(id, userId);
    return {
      id: details.id,
      agentDeploymentId: details.agentDeploymentId,
      status: details.status,
      logs: details.logs,
    };
  }

  async pauseDeployment(id: string, userId?: string) {
    const details = await this.getDeploymentDetails(id, userId);
    const agentDeploymentId = details.agentDeploymentId;

    const paused = await this.agent.pauseDeployment(agentDeploymentId);

    const status = toRuntimeStatus(paused?.status) || 'PAUSED';
    const port = paused?.port ?? details.port ?? null;

    await this.prisma.deployment.update({
      where: { id: details.id },
      data: {
        status,
        url: null,
        port,
        containerId: paused?.containerId ?? details.containerId ?? null,
        lastSyncedAt: new Date(),
      },
    }).catch(() => {});

    await this.prisma.deploymentLog.create({
      data: {
        deploymentId: details.id,
        message: 'Project paused',
      },
    }).catch(() => {});

    return {
      id: details.id,
      agentDeploymentId,
      status,
      url: null,
      localUrl: null,
      port,
      containerId: paused?.containerId ?? details.containerId ?? null,
      logs: paused?.logs || details.logs || [],
    };
  }

  async resumeDeployment(id: string, userId?: string) {
    const details = await this.getDeploymentDetails(id, userId);
    const agentDeploymentId = details.agentDeploymentId;

    const resumed = await this.agent.resumeDeployment(agentDeploymentId);

    // The agent reports READY once the container is up and a *new* Cloudflare
    // tunnel exists; READY is stored as the current-state RUNNING.
    const status = toRuntimeStatus(resumed?.status) || 'RUNNING';
    const url = resumed?.publicUrl || null;
    const port = resumed?.port ?? details.port ?? null;

    await this.prisma.deployment.update({
      where: { id: details.id },
      data: {
        status,
        url,
        port,
        containerId: resumed?.containerId ?? details.containerId ?? null,
        lastSyncedAt: new Date(),
      },
    }).catch(() => {});

    await this.prisma.deploymentLog.create({
      data: {
        deploymentId: details.id,
        message: `Deployment resumed: ${url}`,
      },
    }).catch(() => {});

    return {
      id: details.id,
      agentDeploymentId,
      status,
      url,
      localUrl: resumed?.port ? `http://localhost:${resumed.port}` : null,
      port,
      containerId: resumed?.containerId ?? details.containerId ?? null,
      logs: resumed?.logs || details.logs || [],
    };
  }

  async cancelDeployment(id: string, userId?: string) {
    const details = await this.getDeploymentDetails(id, userId);
    const agentDeploymentId = details.agentDeploymentId;

    let agentResponse: any = null;
    try {
      agentResponse = await this.agent.cancelDeployment(agentDeploymentId);
    } catch {}

    await this.prisma.deployment.update({
      where: { id: details.id },
      data: {
        status: 'FAILED',
        url: null,
        lastSyncedAt: new Date(),
      },
    }).catch(() => {});

    await this.prisma.deploymentLog.create({
      data: {
        deploymentId: details.id,
        message: 'Deployment cancelled by user.',
      },
    }).catch(() => {});

    return {
      id: details.id,
      agentDeploymentId,
      status: 'FAILED',
      message: 'Deployment cancelled successfully',
      agent: agentResponse,
    };
  }

  /**
   * Current deployments only.
   *
   * DeployX keeps no deployment history: we return the newest (current)
   * deployment per project, enriched with the runtime state mirrored from the
   * agent/Docker.
   */
  async getAllDeployments(userId?: string) {
    const whereClause = userId ? { project: { userId } } : {};
    const deployments = await this.prisma.deployment.findMany({
      where: whereClause,
      include: {
        project: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const currentByProject = new Map<string, any>();
    for (const deployment of deployments) {
      if (!currentByProject.has(deployment.projectId)) {
        currentByProject.set(deployment.projectId, deployment);
      }
    }

    const live = await this.agent.getManagedRuntime();
    const liveByKey = this.indexLiveRuntime(live.containers);

    return Array.from(currentByProject.values()).map((deployment) =>
      this.presentDeployment(deployment, liveByKey, live.dockerAvailable),
    );
  }

  private indexLiveRuntime(containers: any[]) {
    const liveByKey = new Map<string, any>();
    for (const container of containers) {
      if (container?.deploymentId) {
        liveByKey.set(String(container.deploymentId), container);
      }
      if (container?.projectId && !liveByKey.has(`project:${container.projectId}`)) {
        liveByKey.set(`project:${container.projectId}`, container);
      }
    }
    return liveByKey;
  }

  private presentDeployment(
    deployment: any,
    liveByKey: Map<string, any>,
    dockerAvailable: boolean,
  ) {
    const liveMatch =
      liveByKey.get(deployment.commitHash || deployment.id) ||
      liveByKey.get(`project:${deployment.projectId}`) ||
      null;

    const liveStatus = liveMatch?.state ? containerStateToStatus(liveMatch.state, true) : null;

    let status = liveStatus || displayStatus(deployment.status);

    const expectsContainer = !!deployment.agentId || !!deployment.containerId;
    if (
      !liveStatus &&
      dockerAvailable &&
      expectsContainer &&
      (status === 'RUNNING' || status === 'PAUSED')
    ) {
      status = 'OFFLINE';
    }

    return {
      id: deployment.id,
      projectId: deployment.projectId,
      projectName: deployment.project?.name || 'Unknown Project',
      projectSlug: deployment.project?.slug || '',
      framework: deployment.project?.framework || null,
      status,
      url: status === 'RUNNING' ? liveMatch?.publicUrl ?? deployment.url ?? null : null,
      port: liveMatch?.port ?? deployment.port ?? null,
      containerId: liveMatch?.containerId ?? deployment.containerId ?? null,
      containerName: liveMatch?.containerName ?? deployment.containerName ?? null,
      agentDeploymentId: deployment.commitHash || deployment.id,
      lastSyncedAt: deployment.lastSyncedAt,
      createdAt: deployment.createdAt,
      updatedAt: deployment.updatedAt,
    };
  }

  async deleteDeployment(id: string, userId?: string) {
    let deployment = await this.prisma.deployment.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!deployment) {
      deployment = await this.prisma.deployment.findFirst({
        where: { projectId: id },
        include: { project: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!deployment) {
      throw new NotFoundException(`Deployment ${id} not found`);
    }

    if (userId && deployment.project && deployment.project.userId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this deployment');
    }

    const agentDeploymentId = deployment.commitHash || deployment.id;

    // Clean up runtime resources on Agent (stop tunnel, remove docker container)
    try {
      await this.agent.deleteDeployment(agentDeploymentId);
    } catch {}

    // Clean up stored build artifacts if any
    try {
      const storagePath = path.resolve(process.cwd(), 'storage', deployment.id);
      if (fs.existsSync(storagePath)) {
        fs.rmSync(storagePath, { recursive: true, force: true });
      }
    } catch {}

    // Delete logs and deployment record
    await this.prisma.deploymentLog.deleteMany({
      where: { deploymentId: deployment.id },
    });

    await this.prisma.deployment.delete({
      where: { id: deployment.id },
    });

    return {
      success: true,
      deleted: true,
      id: deployment.id,
      projectId: deployment.projectId,
      message: 'Deployment runtime permanently deleted (no history retained)',
    };
  }
}