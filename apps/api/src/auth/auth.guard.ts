import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Authentication required. Please log in.');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'deployx-jwt-secret-student-platform-2026',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('User account no longer exists');
      }

      const resolvedRole = this.resolveRole(user.email, user.role);
      request.user = {
        ...user,
        role: resolvedRole,
      };
      return true;
    } catch (err: any) {
      console.error('AuthGuard error:', err?.message || err);
      throw new UnauthorizedException('Invalid or expired authentication session');
    }
  }

  private resolveRole(email: string, currentRole: string | null): 'USER' | 'ADMIN' {
    const configuredAdmins = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);

    if (configuredAdmins.includes(email.toLowerCase()) || currentRole === 'ADMIN') {
      return 'ADMIN';
    }

    return 'USER';
  }

  private extractToken(request: any): string | null {
    if (request.cookies && request.cookies['deployx_token']) {
      return request.cookies['deployx_token'];
    }

    const authHeader = request.headers?.authorization;
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }
}
