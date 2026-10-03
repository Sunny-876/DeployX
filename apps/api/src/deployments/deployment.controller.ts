import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import 'multer';

import { DeploymentService } from './deployment.service.js';
import { UploadService } from '../uploads/upload.service.js';
import { FrameworkService } from '../detector/framework.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator.js';

@UseGuards(AuthGuard)
@Controller()
export class DeploymentController {
  constructor(
    private readonly deploymentService: DeploymentService,
    private readonly uploadService: UploadService,
    private readonly frameworkService: FrameworkService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('projects/:projectId/deployments')
  create(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.deploymentService.create(projectId, user.id);
  }

  @Post('deployments/:id/build')
  build(
    @Param('id') id: string,
    @Body()
    body: {
      projectPath: string;
    },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.deploymentService.build(
      id,
      body.projectPath,
      'npm run build',
      '.',
      user.id,
    );
  }

  @Post('deployments/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      dest: './uploads/tmp',
      limits: {
        fileSize: (Number(process.env.MAX_UPLOAD_SIZE_MB) || 100) * 1024 * 1024,
      },
    }),
  )
  async uploadAndDeploy(
    @UploadedFile() file: Express.Multer.File,
    @Body('projectName') projectName: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const uploaded =
      await this.uploadService.extractZip(file, undefined, user.id);

    const detected =
      this.frameworkService.detect(
        uploaded.projectPath,
      );

    const name = projectName || 'My Uploaded App';
    const baseSlug =
      name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || `app-${Date.now()}`;

    // Find if current user already owns a project with this slug or name
    let project = await this.prisma.project.findFirst({
      where: {
        userId: user.id,
        OR: [{ slug: baseSlug }, { name }],
      },
    });

    if (project) {
      project = await this.prisma.project.update({
        where: { id: project.id },
        data: {
          name,
          framework: detected.framework,
        },
      });
    } else {
      let slug = baseSlug;
      const slugTaken = await this.prisma.project.findUnique({
        where: { slug },
      });
      if (slugTaken) {
        slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;
      }

      project = await this.prisma.project.create({
        data: {
          name,
          slug,
          framework: detected.framework,
          branch: 'main',
          userId: user.id,
        },
      });
    }

    const deployment =
      await this.deploymentService.create(
        project.id,
        user.id,
      );

    const result =
      await this.deploymentService.build(
        deployment.id,
        uploaded.projectPath,
        detected.buildCommand,
        detected.outputDirectory,
        user.id,
      );

    return {
      project,
      deployment,
      build: result,
      framework: detected,
    };
  }

  @Get('projects/:projectId/deployments')
  findAll(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.deploymentService.findAll(
      projectId,
      user.id,
    );
  }

  @Get('deployments/:id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.deploymentService.getDeploymentDetails(id, user.id);
  }

  @Get('deployments/:id/logs')
  getLogs(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.deploymentService.getDeploymentLogs(id, user.id);
  }

  @Post('deployments/:id/pause')
  pause(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.deploymentService.pauseDeployment(id, user.id);
  }

  @Post('deployments/:id/resume')
  resume(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.deploymentService.resumeDeployment(id, user.id);
  }

  @Post('deployments/:id/cancel')
  cancel(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.deploymentService.cancelDeployment(id, user.id);
  }

  @Get('deployments')
  getAll(@CurrentUser() user: AuthenticatedUser) {
    return this.deploymentService.getAllDeployments(user.id);
  }

  @Delete('deployments/:id')
  deleteDeployment(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.deploymentService.deleteDeployment(id, user.id);
  }
}