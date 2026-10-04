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

  // Security Headers Middleware
  app.use((req: any, res: any, next: () => void) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  // Rate Limiting Middleware
  const rateLimiter = new RateLimitMiddleware();
  app.use(rateLimiter.use.bind(rateLimiter));

  // Global Exception Filter (no stack trace leaks to user)
  app.useGlobalFilters(new HttpExceptionFilter());

  app.use(cookieParser());

  // Strict CORS configuration
  const allowedOrigins = getCorsAllowedOrigins();

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (e.g. mobile apps, curl, or agent server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin '${origin}' not allowed by DeployX CORS policy`));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  app.enableShutdownHooks();

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  const port = getApiPort();
  await app.listen(port, '0.0.0.0');
  console.log(`DeployX API running on http://0.0.0.0:${port}`);
}

void bootstrap();