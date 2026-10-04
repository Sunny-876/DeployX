import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';
import { RateLimitMiddleware } from './common/rate-limit.middleware.js';
import { HttpExceptionFilter } from './common/http-exception.filter.js';
import {
  getApiPort,
  getCorsAllowedOrigins,
  getJwtSecret,
} from './config/environment.js';

async function bootstrap() {
  getJwtSecret();
  const app = await NestFactory.create(AppModule);

  // 1. Strict CORS configuration (must be registered FIRST so preflight OPTIONS are answered immediately)
  const allowedOrigins = getCorsAllowedOrigins();

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (e.g. mobile apps, curl, or agent server-to-server)
      if (!origin) {
        return callback(null, true);
      }
      const normalizedOrigin = origin.trim().replace(/\/+$/, '');
      if (allowedOrigins.includes(normalizedOrigin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    exposedHeaders: ['Set-Cookie'],
    credentials: true,
    optionsSuccessStatus: 204,
  });

  // 2. Security Headers Middleware
  app.use((req: any, res: any, next: () => void) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  // 3. Rate Limiting Middleware
  const rateLimiter = new RateLimitMiddleware();
  app.use(rateLimiter.use.bind(rateLimiter));

  // 4. Global Exception Filter (no stack trace leaks to user)
  app.useGlobalFilters(new HttpExceptionFilter());

  // 5. Cookie Parser
  app.use(cookieParser());

  app.enableShutdownHooks();

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  const port = getApiPort();
  await app.listen(port, '0.0.0.0');
  console.log(`DeployX API running on http://0.0.0.0:${port}`);
}

void bootstrap();