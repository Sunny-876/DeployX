import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AgentAuthGuard } from './agent-auth.guard.js';
import type { AgentRequestUser } from './agent-auth.guard.js';
import { CurrentAgent } from './current-agent.decorator.js';
import { AgentsService } from './agents.service.js';
import type { AgentContainerReport } from './agents.service.js';

interface HeartbeatPayload {
  version?: string;
  hostname?: string;
  status?: string;
  dockerAvailable?: boolean;
  containers?: AgentContainerReport[];
}

@UseGuards(AgentAuthGuard)
@Controller('agents')
export class AgentHeartbeatController {
  constructor(private readonly agents: AgentsService) {}

  /**
   * Heartbeat now carries the managed-container runtime state so the dashboard
   * stays synchronized with Docker on every beat (not just on startup).
   */
  @Post('heartbeat')
  heartbeat(
    @CurrentAgent() agent: AgentRequestUser,
    @Body() body: HeartbeatPayload,
  ) {
    return this.agents.heartbeat(agent.id, agent.userId, body || {});
  }
}
