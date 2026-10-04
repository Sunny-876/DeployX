const LOCAL_CORS_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

export function getJwtSecret(env: NodeJS.ProcessEnv = process.env): string {
  const secret = env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error('JWT_SECRET must be configured before starting the API.');
  }
  if (env.NODE_ENV === 'production' && secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production.');
  }
  return secret;
}

export function getDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const databaseUrl = env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error('DATABASE_URL must be configured before starting the API.');
  }
  return databaseUrl;
}

export function getCorsAllowedOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
  const rawOrigins = env.CORS_ALLOWED_ORIGINS || env.CORS_ORIGINS;
  const configuredOrigins = rawOrigins
    ?.split(',')
    .map((origin) => origin.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, ''))
    .filter(Boolean);

  if (configuredOrigins?.includes('*')) {
    throw new Error('CORS_ALLOWED_ORIGINS must not contain a wildcard origin.');
  }

  if (env.NODE_ENV === 'production' && !configuredOrigins?.length) {
    throw new Error('CORS_ALLOWED_ORIGINS must be configured in production.');
  }

  if (configuredOrigins?.length) {
    if (env.NODE_ENV !== 'production') {
      return Array.from(new Set([...configuredOrigins, ...LOCAL_CORS_ORIGINS]));
    }
    return configuredOrigins;
  }

  return LOCAL_CORS_ORIGINS;
}

export function getApiPort(env: NodeJS.ProcessEnv = process.env): number {
  const portValue =
    env.PORT ||
    (env.NODE_ENV === 'production' ? undefined : env.API_PORT || '4000');

  if (!portValue) {
    throw new Error('PORT must be configured in production.');
  }

  const port = Number(portValue);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }

  return port;
}
