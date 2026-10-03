# DeployX Production Infrastructure & Deployment Guide

This guide details the steps to deploy the DeployX platform (Dashboard, API, Database, and Agent) to production environments.

---

## 1. Production Architecture Overview

```text
               INTERNET
                  │
                  ▼
          ┌───────────────┐
          │ DeployX       │
          │ Dashboard     │  (Next.js on Vercel)
          └───────┬───────┘
                  │ HTTPS (Cookie / Bearer)
                  ▼
          ┌───────────────┐
          │ DeployX API   │  (NestJS on Render / Railway / Fly.io)
          └───────┬───────┘
                  │ SSL / Connection Pool
                  ▼
          ┌───────────────┐
          │ PostgreSQL    │  (Neon / Supabase / AWS RDS)
          └───────────────┘

Student PC:
          ┌─────────────────────┐
          │ DeployX Agent       │  (NestJS daemon on localhost:4100)
          └──────────┬──────────┘
                     │ Outbound HTTPS (Heartbeats / Sync)
                     ▼
                DeployX API
                     │
                     ▼
                   Docker (Local node:22-alpine / custom)
                     │
                     ▼
              Cloudflare Tunnel (trycloudflare.com)
```

> **CRITICAL SECURITY GUARANTEE**: The DeployX cloud API **never** executes student code. No student builds or Docker containers run on the cloud server. All project builds and container execution remain strictly isolated on the student's machine.

---

## 2. Database Setup (PostgreSQL)

DeployX requires PostgreSQL 16+. For zero-cost initial production, we recommend **Neon** (serverless PostgreSQL with connection pooling).

### Setup Steps:
1. Create a project in [Neon](https://neon.tech) or [Supabase](https://supabase.com).
2. Obtain the pooled connection string (with `?sslmode=require`).
3. Set `DATABASE_URL` in the API environment:
   ```bash
   DATABASE_URL="postgresql://<user>:<password>@<neon-pooler-host>/deployx?sslmode=require&connection_limit=25"
   ```

### Running Production Migrations:
Never use `prisma db push` in production. Always apply migrations deterministically:
```bash
# From workspace root:
pnpm --filter api run migrate:deploy

# Or inside apps/api:
npx prisma migrate deploy
```

---

## 3. API Deployment (NestJS)

Deploy the API server to a Node-compatible host such as **Render**, **Railway**, or **Fly.io**.

### Host Settings:
- **Build Command**: `pnpm install && pnpm --filter api build`
- **Start Command**: `pnpm --filter api run start:prod` (or `node dist/main.js` from `apps/api`)
- **Node Version**: `20.x` or `22.x`
- **Port**: Bound to `process.env.PORT` on `0.0.0.0` (automatically managed by hosting platform)
- **Pre-deploy / Release Command**: `pnpm --filter api run migrate:deploy`

### Production Environment Variables (API):
```bash
NODE_ENV=production
DATABASE_URL="postgresql://<user>:<password>@<host>/<db>?sslmode=require"
JWT_SECRET="<generate-random-32-character-secret>"
CORS_ALLOWED_ORIGINS="https://deployx.vercel.app,https://yourdomain.com"
MAX_UPLOAD_SIZE_MB=100
MAX_EXTRACTED_SIZE_MB=300
MAX_ZIP_FILES=10000
MAX_ZIP_DEPTH=15
AGENT_PAIRING_TTL_MS=600000
AGENT_HEARTBEAT_INTERVAL_MS=15000
AGENT_OFFLINE_AFTER_MS=45000
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_DEFAULT_MAX=120
RATE_LIMIT_AUTH_MAX=30
RATE_LIMIT_PAIR_MAX=15
RATE_LIMIT_DEPLOY_MAX=40
```

### Health Check Endpoint:
- `GET https://<api-domain>/health` -> Returns `200 OK` with `{ status: 'ok', service: 'deployx-api' }`.

---

## 4. Dashboard Deployment (Vercel)

Deploy `apps/dashboard` as a Next.js application on **Vercel**.

### Vercel Project Settings:
- **Framework Preset**: Next.js
- **Root Directory**: `apps/dashboard` (or repository root if building monorepo)
- **Build Command**: `pnpm build`
- **Output Directory**: `.next`
- **Install Command**: `pnpm install`

### Production Environment Variables (Dashboard):
```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL="https://<your-api-domain>"
```

---

## 5. Agent Production Configuration

Students install and run the DeployX Agent on their local computer to connect their Docker runtime to DeployX.

### Student Installation:
1. Student clones or downloads the repository:
   ```bash
   git clone https://github.com/deployx/deployx.git
   cd deployx
   pnpm install
   ```
2. Student sets the production API URL in `apps/agent/.env`:
   ```bash
   DEPLOYX_API_URL="https://<your-api-domain>"
   AGENT_PORT=4100
   ```
3. Student runs the Agent daemon:
   ```bash
   pnpm --filter agent start
   ```
4. Student visits `http://localhost:4100` and enters the 6-digit pairing code from the DeployX dashboard.

---

## 6. Security & Hardening Checklist

| Area | Production Setting | Notes |
| :--- | :--- | :--- |
| **CORS** | Strict whitelist (`CORS_ALLOWED_ORIGINS`) | Never use `*` with credentials |
| **Cookie Security** | `httpOnly: true`, `sameSite: 'lax'`, `secure: true` in production | Protects JWT from XSS |
| **Headers** | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block` | Enabled globally |
| **Rate Limiting** | Active on auth, pairing, and upload endpoints | Protects against brute-force |
| **ZIP Protection** | Path traversal (Zip Slip), file count, and uncompressed size limits | Strict validation before unpacking |
| **Container Limits** | `Memory: 2g`, `NanoCpus: 2`, `PidsLimit: 512`, `no-new-privileges: true` | Prevents runaway containers |
| **Secret Redaction** | JWT, DB credentials, and bearer tokens redacted from logs | Built into runtime logging |

---

## 7. Rollback & Disaster Recovery

### Application Rollback:
- **Dashboard**: Use Vercel's Instant Rollback feature to revert to any previous deployment with zero downtime.
- **API**: Re-deploy the previous Git commit tag on Render/Railway.

### Database Migration Rollback:
If a migration needs to be rolled back:
```bash
# 1. Inspect migration history
npx prisma migrate status

# 2. Revert changes via a forward-fixing migration
npx prisma migrate dev --name revert_feature

# 3. Apply fix in production
npx prisma migrate deploy
```
