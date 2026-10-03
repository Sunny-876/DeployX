import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator.js';
import { AgentsService } from './agents.service.js';

@UseGuards(AuthGuard)
@Controller('agents')
export class AgentsController {
  constructor(private readonly agents: AgentsService) {}

  @Post('pair')
  pair(@CurrentUser() user: AuthenticatedUser) {
    return this.agents.generatePairingCode(user.id);
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.agents.listForUser(user.id);
  }

  @Post(':id/revoke')
  revoke(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.agents.revoke(id, user.id);
  }
}
