# DeployX Security Model

## Core Principle

**The cloud API (Render) NEVER executes student project code.**

Student project code runs exclusively inside Docker containers on the student machine,
managed by DeployX Agent. The cloud API is a pure orchestration service - it stores
metadata, manages authentication, coordinates pairing, and receives heartbeats.

---

## Authentication

| Layer | Mechanism |
|:------|:---------|
| User auth | JWT signed with HS256, stored as httpOnly cookie |
| Agent auth | Random 256-bit token, stored as SHA-256 hash in DB |
| API-to-Agent | Bearer token in Authorization header |
| Cross-site (Vercel/Render) | sameSite=none + secure=true in production |

---

## CORS Policy

- Strict allowlist (`CORS_ALLOWED_ORIGINS` env var)
- Never uses wildcard `*` when credentials are sent
- Fails closed (rejects unknown origins with 403)

---

## Upload Hardening

| Guard | Implementation |
|:------|:--------------|
| File type | Only `.zip` files accepted |
| Upload size | Configurable limit (default 100 MB) |
| Zip Slip (path traversal) | Canonical path check; entries with `..`, absolute paths, null bytes rejected |
| Zip Bomb | Extracted byte counter tracked in streaming; decompression aborted when limit exceeded |
| File count limit | Maximum 10,000 files per archive |
| Directory depth | Maximum 15 nested levels |

---

## Container Isolation

Student containers run with:
- `Memory: 2g` (configurable via `CONTAINER_MEMORY_LIMIT`)
- `NanoCpus: 2 * 1e9` (configurable via `CONTAINER_CPU_LIMIT`)
- `PidsLimit: 512` (configurable via `CONTAINER_PIDS_LIMIT`)
- `SecurityOpt: [no-new-privileges:true]`
- Docker socket **NOT mounted** into containers
- Host filesystem **NOT mounted** except project directory
- Containers never receive API secrets, JWT_SECRET, or DATABASE_URL

---

## Log Sanitization

All container log output is sanitized before storage or transmission:
- JWT tokens redacted to `[REDACTED_JWT]`
- Database passwords redacted to `[REDACTED_PASSWORD]`
- Bearer tokens redacted to `Bearer [REDACTED]`
- Generic secrets/keys redacted to `secret=[REDACTED]`

---

## Rate Limiting

All API endpoints are rate-limited using an in-memory sliding window:

| Endpoint group | Default limit |
|:---------------|:-------------|
| General | 120 req/min |
| Auth (login, register) | 30 req/min |
| Agent pairing | 15 req/min |
| Deployments | 40 req/min |

---

## Security Headers

Applied globally to all API responses:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

---

## Ownership Isolation (Multi-User IDOR Prevention)

Every API endpoint that reads or mutates a resource (project, deployment, agent)
verifies that the authenticated user owns that resource before proceeding.
Cross-user access returns `403 Forbidden` without leaking resource existence.

---

## Production Checklist

- [ ] `JWT_SECRET` is at least 32 characters of random data
- [ ] `DATABASE_URL` uses SSL (`?sslmode=require`)
- [ ] `CORS_ALLOWED_ORIGINS` lists only your Vercel domain(s)
- [ ] `NODE_ENV=production` is set on Render
- [ ] Agent tokens are never logged or stored in plaintext
- [ ] `cloudflared` is not accessible to project containers
