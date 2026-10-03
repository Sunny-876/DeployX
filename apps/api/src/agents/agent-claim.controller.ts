import { Body, Controller, Post } from '@nestjs/common';
import { AgentsService } from './agents.service.js';

@Controller('agent')
export class AgentClaimController {
  constructor(private readonly agents: AgentsService) {}

  @Post('pair')
  pair(@Body() body: { code?: string; name?: string; version?: string; hostname?: string }) {
    return this.agents.claimPairing(body || {});
  }
}
