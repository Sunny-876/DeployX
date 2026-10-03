# DeployX

> **Self-Hosted Application Deployment Platform for Student & Developer Projects**

DeployX connects local Docker environments to a centralized dashboard and API, enabling instant deployment, real-time log streaming, health verification, and public URL generation via Cloudflare Quick Tunnels.

---

## 1. System Architecture

```text
┌────────────────────────────────────────────────────────┐
│                   DeployX Dashboard                    │
│            Next.js 16 + React 19 + Turbopack           │
│                   (http://localhost:3000)              │
└──────────────────────────┬─────────────────────────────┘
                           │ Authenticated HTTP / Cookies
                           ▼
┌────────────────────────────────────────────────────────┐
│                      DeployX API                       │
│              NestJS 12 + Prisma 7 + PostgreSQL          │
│                   (http://localhost:4000)              │
└──────────────────────────┬─────────────────────────────┘
                           │ Heartbeat / Reconcile / Commands
                           ▼
┌────────────────────────────────────────────────────────┐
│                     DeployX Agent                      │
│                 NestJS 12 Local Daemon                 │
│                   (http://localhost:4100)              │
└──────────────┬─────────────────────────┬───────────────┘
               │ Docker Socket / CLI     │ Cloudflared Tunnel
               ▼                         ▼
┌────────────────────────────┐ ┌─────────────────────────┐
│     Docker Containers      │ │   Public HTTPS URL      │
│  (node:22-alpine / Custom) │ │ (*.trycloudflare.com)   │
└────────────────────────────┘ └─────────────────────────┘
```

---

## 2. Prerequisites & Docker Requirements

- **Node.js**: v20+ (v24 LTS recommended)
- **pnpm**: v9+ (v12+ supported)
- **Docker Desktop**: Running with WSL2 (Windows) or native Docker Engine (Linux/macOS)
- **PostgreSQL**: v16+
- **cloudflared**: Installed and accessible in system `PATH` (for public URL tunneling)

---

## 3. Environment Variables

Copy `.env.example` to configure your environment:

| Variable | Default | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://...` | PostgreSQL connection string |
| `JWT_SECRET` | `deployx-jwt-...` | Secret for signing user authentication tokens |
| `API_PORT` | `4000` | Port for the API server |
| `AGENT_PORT` | `4100` | Port for the local Agent daemon |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated allowed origins |
| `MAX_UPLOAD_SIZE_MB` | `100` | Maximum ZIP archive upload size |
| `MAX_EXTRACTED_SIZE_MB` | `300` | Maximum extracted archive size (Zip Bomb guard) |
| `MAX_ZIP_FILES` | `10000` | Maximum number of files inside an archive |
| `MAX_ZIP_DEPTH` | `15` | Maximum nested directory depth |
| `BUILD_TIMEOUT_MS` | `900000` (15m) | Maximum project build execution time |
| `STARTUP_TIMEOUT_MS` | `180000` (3m) | Maximum container health verification time |
| `CONTAINER_MEMORY_LIMIT` | `2g` | Maximum RAM per student container |
| `CONTAINER_CPU_LIMIT` | `2` | Maximum CPU cores per student container |
| `CONTAINER_PIDS_LIMIT` | `512` | Maximum process count per student container |

---

## 4. Running Locally

### Step 1: Install Dependencies
```bash
pnpm install
```

### Step 2: Database Setup
```bash
pnpm --filter api run postinstall
# Run Prisma migrations if needed:
pnpm --filter api exec prisma migrate deploy
```

### Step 3: Start Services
Open separate terminals or run in parallel:

```bash
# Terminal 1: API Server (port 4000)
pnpm --filter api run start:dev

# Terminal 2: Agent Daemon (port 4100)
pnpm --filter agent run start:dev

# Terminal 3: Dashboard Web UI (port 3000)
pnpm --filter dashboard run dev
```

---

## 5. Deployment Lifecycle & State Machine

1. **Upload & Inspect**: User uploads project ZIP via Dashboard. The API validates upload limits, extracts safely (blocking path traversal and zip bombs), and detects project type (Vite, Next.js, Static, Node).
2. **Build**: Project transferred to Agent. Docker spins up an isolated `node:22-alpine` container with strict memory, CPU, and PID limits.
3. **Health Check**: Agent polls application port until HTTP status is healthy (within `STARTUP_TIMEOUT_MS`).
4. **Cloudflare Quick Tunnel**: Tunnel spawned for the assigned port; returns `https://<hash>.trycloudflare.com`.
5. **State Progression**:
   - `QUEUED` → `BUILDING` → `STARTING` → `READY` (`RUNNING`)
   - On Pause: Tunnel stopped, container paused → `PAUSED`.
   - On Resume: Container unpaused, new tunnel spawned → `READY` (`RUNNING`).
   - On Failure: Container destroyed, port released → `FAILED`.
   - On Cancel: Build killed, resources cleaned up immediately.

---

## 6. Security Model

- **Path Traversal / Zip Slip Prevention**: Strict canonicalization checks reject any entry containing `..`, absolute paths, null bytes, or paths exceeding max directory depth.
- **Zip Bomb Mitigation**: Extracted bytes tracked in real-time; decompression terminates immediately if limits are exceeded.
- **Secret Isolation**: Containers receive **only** necessary runtime variables (`PORT`, `HOST`). Host environment variables, `DATABASE_URL`, `JWT_SECRET`, and `AGENT_TOKEN` are never mounted or passed.
- **Network & Host Isolation**: The Docker socket (`/var/run/docker.sock`) is never mounted to student containers. Privileges are restricted via `no-new-privileges:true`.
- **Log Sanitization**: Logs are dynamically scanned and redacted for JWTs, database connection strings, and bearer tokens.
- **Rate Limiting & Security Headers**: Strict rate limiting applied to auth, pairing, and upload endpoints. Production security headers (`X-Frame-Options`, `X-Content-Type-Options: nosniff`) enabled.
- **Ownership Verification**: Every API query and mutation verifies authenticated user ID against project, deployment, and paired agent ownership.

---

## 7. Testing

Run integration and hardening test suites:
```bash
pnpm test
```
