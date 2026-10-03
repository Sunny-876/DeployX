import { Module } from '@nestjs/common';

import { DeploymentController } from './deployment.controller.js';
import { DeploymentService } from './deployment.service.js';

import { BuilderModule } from '../builder/builder.module.js';
import { ArtifactModule } from '../artifacts/artifact.module.js';
import { UploadModule } from '../uploads/upload.module.js';
import { FrameworkModule } from '../detector/framework.module.js';
import { AgentModule } from '../agent/agent.module.js';
import { AgentsModule } from '../agents/agents.module.js';

@Module({
  imports: [
    BuilderModule,
    ArtifactModule,
    UploadModule,
    FrameworkModule,
    AgentModule,
    AgentsModule,
  ],
  controllers: [DeploymentController],
  providers: [DeploymentService],
})
export class DeploymentModule {}