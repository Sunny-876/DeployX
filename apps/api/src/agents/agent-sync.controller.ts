import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AgentAuthGuard } from './agent-auth.guard.js';
import type { AgentRequestUser } from './agent-auth.guard.js';
import { CurrentAgent } from './current-agent.decorator.js';
import { AgentsService } from './agents.service.js';
import type { AgentContainerReport } from './agents.service.js';

interface SyncPayload {
  version?: string;
  hostname?: string;
  status?: string;
  dockerAvailable?: boolean;
  containers?: AgentContainerReport[];
  unmanaged?: AgentContainerReport[];
}

/**
 * Internal runtime synchronization endpoint.
 *
 * Only an agent holding a valid DeployX agent token may report runtime state.
 * The browser can never submit runtime information: user/project/agent ids are
 * always taken from the authenticated agent, never from the request body.
 */
@UseGuards(AgentAuthGuard)
@Controller('agents')
export class AgentSyncController {
  constructor(private readonly agents: AgentsService) {}

  @Post('sync')
  sync(@CurrentAgent() agent: AgentRequestUser, @Body() body: SyncPayload) {
    return this.agents.syncRuntime(agent.id, agent.userId, body || {});
  }
}
