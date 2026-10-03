import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service.js';

export interface AgentRequestUser {
  id: string;
  userId: string;
  name: string;
}

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

@Injectable()
export class AgentAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const header: string | undefined = request.headers?.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Agent credential required');
    }
    const raw = header.substring(7).trim();
    if (!raw) {
      throw new UnauthorizedException('Agent credential required');
    }
    const tokenHash = hashToken(raw);
    const agent = await this.prisma.agent.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, name: true, revokedAt: true },
    });
    if (!agent || agent.revokedAt) {
      throw new UnauthorizedException('Invalid or revoked agent credential');
    }
    request.agent = { id: agent.id, userId: agent.userId, name: agent.name } as AgentRequestUser;
    return true;
  }
}
