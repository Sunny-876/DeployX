import { Module } from '@nestjs/common';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

import { PrismaModule } from './prisma/prisma.module.js';
import { ProjectsModule } from './projects/projects.module.js';
import { DeploymentModule } from './deployments/deployment.module.js';
import { BuilderModule } from './builder/builder.module.js';
import { ArtifactModule } from './artifacts/artifact.module.js';
import { UploadModule } from './uploads/upload.module.js';
import { FrameworkModule } from './detector/framework.module.js';
import { TunnelModule } from './tunnel/tunnel.module.js';
import { AgentModule } from './agent/agent.module.js';
import { AgentsModule } from './agents/agents.module.js';
import { AuthModule } from './auth/auth.module.js';
import { RuntimeModule } from './runtime/runtime.module.js';
import { AdminModule } from './admin/admin.module.js';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AdminModule,
    AgentsModule,
    ProjectsModule,
    DeploymentModule,
    BuilderModule,
    ArtifactModule,
    UploadModule,
    FrameworkModule,
    TunnelModule,
    AgentModule,
    RuntimeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}