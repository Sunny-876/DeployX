import { JwtService } from '@nestjs/jwt';
import {
  getApiPort,
  getCorsAllowedOrigins,
  getDatabaseUrl,
  getJwtSecret,
} from './environment.js';

describe('API environment configuration', () => {
  it('requires JWT_SECRET instead of using a fallback', () => {
    expect(() => getJwtSecret({ NODE_ENV: 'production' })).toThrow(
      'JWT_SECRET must be configured',
    );
    expect(() =>
      getJwtSecret({ NODE_ENV: 'production', JWT_SECRET: 'short-secret' }),
    ).toThrow('at least 32 characters');
    expect(
      getJwtSecret({
        NODE_ENV: 'production',
        JWT_SECRET: 'configured-test-secret-with-at-least-32-characters',
      }),
    ).toBe(
      'configured-test-secret-with-at-least-32-characters',
    );
  });

  it('signs and verifies authentication tokens with the configured secret', async () => {
    const jwt = new JwtService({
      secret: getJwtSecret({
        JWT_SECRET: 'configured-test-secret-with-at-least-32-characters',
      }),
      signOptions: { expiresIn: '7d' },
    });
    const token = await jwt.signAsync({ sub: 'user-id' });

    await expect(jwt.verifyAsync(token)).resolves.toMatchObject({
      sub: 'user-id',
    });
  });

  it('requires DATABASE_URL', () => {
    expect(() => getDatabaseUrl({})).toThrow('DATABASE_URL must be configured');
    expect(getDatabaseUrl({ DATABASE_URL: 'postgresql://localhost/test' })).toBe(
      'postgresql://localhost/test',
    );
  });

  it('requires explicit, non-wildcard CORS origins in production', () => {
    expect(() => getCorsAllowedOrigins({ NODE_ENV: 'production' })).toThrow(
      'CORS_ALLOWED_ORIGINS must be configured',
    );
    expect(() =>
      getCorsAllowedOrigins({
        NODE_ENV: 'production',
        CORS_ALLOWED_ORIGINS: '*',
      }),
    ).toThrow('must not contain a wildcard');
    expect(
      getCorsAllowedOrigins({
        NODE_ENV: 'production',
        CORS_ALLOWED_ORIGINS: 'https://app.example, https://admin.example',
      }),
    ).toEqual(['https://app.example', 'https://admin.example']);
  });

  it('uses local CORS origins and port defaults only outside production', () => {
    expect(getCorsAllowedOrigins({ NODE_ENV: 'development' })).toEqual([
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ]);
    expect(getApiPort({ NODE_ENV: 'development' })).toBe(4000);
    expect(() => getApiPort({ NODE_ENV: 'production' })).toThrow(
      'PORT must be configured in production',
    );
    expect(getApiPort({ NODE_ENV: 'production', PORT: '8080' })).toBe(8080);
  });
});
