import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AgentsController } from './agents.controller.js';
import { AgentClaimController } from './agent-claim.controller.js';
import { AgentHeartbeatController } from './agent-heartbeat.controller.js';
import { AgentSyncController } from './agent-sync.controller.js';
import { AgentCommandController } from './agent-command.controller.js';
import { AgentsService } from './agents.service.js';
import { AgentAuthGuard } from './agent-auth.guard.js';

@Module({
  imports: [PrismaModule],
  controllers: [
    AgentsController,
    AgentClaimController,
    AgentHeartbeatController,
    AgentSyncController,
    AgentCommandController,
  ],
  providers: [AgentsService, AgentAuthGuard],
  exports: [AgentsService],
})
export class AgentsModule {}
