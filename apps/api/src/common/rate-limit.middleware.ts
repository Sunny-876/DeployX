import { Injectable, NestMiddleware, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly store = new Map<string, RateLimitRecord>();

  use(req: Request, res: Response, next: NextFunction) {
    if (req.method === 'OPTIONS') {
      return next();
    }

    const forwarded = req.headers['x-forwarded-for'];
    const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : (req.ip || req.socket.remoteAddress || '127.0.0.1');
    const path = req.path || req.url || '';
    const method = req.method;

    // Configurable rate limits with sensible defaults
    let max = Number(process.env.RATE_LIMIT_DEFAULT_MAX) || 120;
    const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000;

    if (path.includes('/auth/login') || path.includes('/auth/register')) {
      max = Number(process.env.RATE_LIMIT_AUTH_MAX) || 30;
    } else if (path.includes('/agents/pair')) {
      max = Number(process.env.RATE_LIMIT_PAIR_MAX) || 15;
    } else if (path.includes('/uploads/zip') || (path.includes('/deployments') && method === 'POST')) {
      max = Number(process.env.RATE_LIMIT_DEPLOY_MAX) || 40;
    }

    const key = `${ip}:${method}:${path.split('?')[0]}`;
    const now = Date.now();
    const record = this.store.get(key);

    if (!record || now > record.resetAt) {
      this.store.set(key, { count: 1, resetAt: now + windowMs });
      // Occasional cleanup of expired records to avoid memory growth
      if (this.store.size > 2000) {
        for (const [k, v] of this.store.entries()) {
          if (now > v.resetAt) this.store.delete(k);
        }
      }
      return next();
    }

    record.count++;
    if (record.count > max) {
      const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfterSeconds));
      return res.status(HttpStatus.TOO_MANY_REQUESTS).json({
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please wait a moment and try again.',
      });
    }

    next();
  }
}
