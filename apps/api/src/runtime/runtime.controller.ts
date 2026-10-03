import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator.js';
import { RuntimeService } from './runtime.service.js';

/**
 * Current runtime state for the signed-in user, synchronized with the DeployX
 * Agent / Docker. Everything the dashboard displays comes from here (or from
 * /projects and /deployments, which read the same mirrored state).
 */
@UseGuards(AuthGuard)
@Controller('runtime')
export class RuntimeController {
  constructor(private readonly runtime: RuntimeService) {}

  @Get()
  snapshot(@CurrentUser() user: AuthenticatedUser) {
    return this.runtime.snapshot(user.id);
  }
}
