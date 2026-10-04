# DeployX

> **Self-Hosted Application Deployment Platform for Student & Developer Projects**

DeployX connects local Docker environments to a centralized dashboard and API, enabling instant deployment, real-time log streaming, health verification, and public URL generation via Cloudflare Quick Tunnels.

## Connect Your PC

1. Open the DeployX dashboard.
2. Click "Connect Your PC".
3. Download the Windows DeployX Agent installer.
4. Run the installer and keep the default install location.
5. Start the Agent and open http://localhost:4100.
6. Enter the six-digit pairing code shown in the dashboard.
7. The Agent will appear online and begin handling local Docker builds.

---

## 1. System Architecture

### Local Development

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

### Production

```text
             Internet
                |
                v
     Dashboard (Vercel) -- HTTPS / httpOnly cookie (sameSite=none) -->
                |
                v
       API (Render / Railway)
                |  PostgreSQL SSL
                v
         Neon / Supabase DB

  Student PC:
    Agent (port 4100) -- outbound HTTPS heartbeats --> API
         |
         v
   Docker containers --> Cloudflare Quick Tunnel --> Public URL
```

> **Security Guarantee**: The cloud API **NEVER** executes student code. All
> builds and containers run exclusively on the student's machine.
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
| `JWT_SECRET` | Set in environment | Secret for signing user authentication tokens |
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

---

## 8. Beta Limitations

DeployX is currently a closed beta and should be treated as a local-runtime prototype, not a permanent hosting platform.

- Temporary public URLs are expected and will expire or be replaced during the active deployment.
- The student PC must remain online while the deployment is running.
- Project execution stops when the computer shuts down or disconnects.
- Docker Desktop is required for the local runtime path.
- Windows is the intended public deployment target for the Agent.
- No custom-domain hosting or permanent public runtime is guaranteed in this beta.

---

## 9. Reporting Bugs and Feedback

Please use the repository issue tracker to report bugs or request features:

- GitHub Issues: https://github.com/DeployX/DeployX/issues
- Security issues: use the repository's private security reporting path rather than a public issue.

When reporting a bug, include:
- DeployX Agent version
- Windows version
- Docker version
- browser
- deployment ID if available
- project framework
- error message
- steps to reproduce
- relevant log excerpt

Do not include passwords, tokens, environment secrets, or database credentials.

---

## 10. Release Process

Agent releases are versioned as `X.Y.Z` and stored in `releases/` after generation.

Example:

```powershell
pwsh -File .\scripts\release-agent.ps1 -Version 0.1.0
```

This command validates the version, builds the Agent, prepares the Windows installer, and writes a SHA-256 checksum file. It does not publish a GitHub release automatically.

---

## 11. Documentation

| Guide | Description |
|:------|:------------|
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Step-by-step guide to go live on Vercel + Render + Neon |
| [docs/AGENT.md](docs/AGENT.md) | Student agent installation, pairing, and troubleshooting |
| [docs/SECURITY.md](docs/SECURITY.md) | Security model, threat mitigations, and production checklist |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Common errors and fixes |
| [docs/PRODUCTION.md](docs/PRODUCTION.md) | Detailed production infrastructure reference |
