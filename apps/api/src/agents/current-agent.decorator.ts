import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AgentRequestUser } from './agent-auth.guard.js';

export const CurrentAgent = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AgentRequestUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.agent;
  },
);
