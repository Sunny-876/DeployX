import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { AdminGuard } from './admin.guard.js';

@UseGuards(AuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('overview')
  async getOverview() {
    const [
      totalUsers,
      totalAgents,
      onlineAgents,
      totalProjects,
      activeDeployments,
      pausedDeployments,
      failedDeployments,
      staleAgents,
      recentUsers,
      recentDeployments,
      recentLogs,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.agent.count(),
      this.prisma.agent.count({ where: { status: 'ONLINE' } }),
      this.prisma.project.count(),
      this.prisma.deployment.count({
        where: { status: { in: ['RUNNING', 'READY'] } },
      }),
      this.prisma.deployment.count({ where: { status: 'PAUSED' } }),
      this.prisma.deployment.count({ where: { status: 'FAILED' } }),
      this.prisma.agent.count({
        where: {
          lastSeenAt: {
            lt: new Date(Date.now() - 12 * 60 * 60 * 1000),
          },
        },
      }),
      this.prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      }),
      this.prisma.deployment.findMany({
        take: 6,
        orderBy: { updatedAt: 'desc' },
        include: {
          project: {
            select: {
              name: true,
              slug: true,
              user: {
                select: {
                  email: true,
                  name: true,
                },
              },
            },
          },
          agent: {
            select: {
              name: true,
              hostname: true,
            },
          },
        },
      }),
      this.prisma.deploymentLog.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          deployment: {
            select: {
              id: true,
              status: true,
              project: {
                select: {
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      totalUsers,
      totalAgents,
      onlineAgents,
      totalProjects,
      activeDeployments,
      pausedDeployments,
      failedDeployments,
      staleAgents,
      lastUpdatedAt: new Date().toISOString(),
      recentUsers,
      recentDeployments: recentDeployments.map((deployment) => ({
        id: deployment.id,
        status: deployment.status,
        url: deployment.url,
        projectName: deployment.project.name,
        projectSlug: deployment.project.slug,
        ownerEmail: deployment.project.user.email,
        ownerName: deployment.project.user.name,
        agentName: deployment.agent?.name ?? 'Unassigned',
        updatedAt: deployment.updatedAt,
      })),
      recentLogs: recentLogs.map((log) => ({
        id: log.id,
        message: log.message,
        createdAt: log.createdAt,
        deploymentId: log.deployment.id,
        deploymentStatus: log.deployment.status,
        projectName: log.deployment.project.name,
      })),
    };
  }

  @Get('users')
  async getUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            projects: true,
            agents: true,
          },
        },
      },
    });

    return users.map(({ _count, ...user }) => ({
      ...user,
      projectCount: _count.projects,
      agentCount: _count.agents,
    }));
  }

  @Get('agents')
  async getAgents() {
    const agents = await this.prisma.agent.findMany({
      orderBy: { lastSeenAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        _count: {
          select: {
            deployments: true,
          },
        },
      },
    });

    return agents.map(({ _count, user, ...agent }) => ({
      ...agent,
      owner: user,
      deploymentCount: _count.deployments,
    }));
  }

  @Get('deployments')
  async getDeployments() {
    const deployments = await this.prisma.deployment.findMany({
      take: 100,
      orderBy: { updatedAt: 'desc' },
      include: {
        project: {
          select: {
            name: true,
            slug: true,
            user: {
              select: {
                email: true,
                name: true,
              },
            },
          },
        },
        agent: {
          select: {
            name: true,
            hostname: true,
          },
        },
      },
    });

    return deployments.map((deployment) => ({
      id: deployment.id,
      project: {
        name: deployment.project.name,
        slug: deployment.project.slug,
        owner: deployment.project.user,
      },
      agent: deployment.agent,
      status: deployment.status,
      url: deployment.url,
      port: deployment.port,
      commitHash: deployment.commitHash,
      createdAt: deployment.createdAt,
      updatedAt: deployment.updatedAt,
      lastSyncedAt: deployment.lastSyncedAt,
    }));
  }

  @Get('logs')
  async getLogs() {
    const logs = await this.prisma.deploymentLog.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        deployment: {
          select: {
            id: true,
            status: true,
            project: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    return logs.map((log) => ({
      id: log.id,
      message: log.message,
      createdAt: log.createdAt,
      deploymentId: log.deployment.id,
      deploymentStatus: log.deployment.status,
      projectName: log.deployment.project.name,
      projectSlug: log.deployment.project.slug,
    }));
  }
}
