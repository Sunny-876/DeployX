# DeployX Agent - Setup Guide

The DeployX Agent is a lightweight NestJS daemon that runs on the student machine.
It connects your local Docker runtime to the DeployX cloud API so you can deploy
projects directly from the dashboard.

---

## Architecture

```
Dashboard (Vercel)
       |
       | HTTPS
       v
  DeployX API (Render)
       ^
       |  Outbound HTTPS heartbeats
  DeployX Agent (YOUR PC)
       |
       v
  Docker Desktop
       |
       v
  Student project containers
       |
       v
  Cloudflare Quick Tunnel --> public URL
```

The **API never executes student code**. All builds run inside Docker on your PC.

---

## Prerequisites

- Node.js v20+ (v24 LTS recommended)
- pnpm v9+
- Docker Desktop (running)
- `cloudflared` in system PATH

---

## Installation

```bash
# Clone the DeployX repository
git clone https://github.com/your-org/deployx.git
cd deployx

# Install all dependencies
pnpm install
```

---

## Configuration

Create `apps/agent/.env` from the example:

```bash
cp apps/agent/.env.example apps/agent/.env
```

Edit the file and set your production API URL:

```env
# Required: Point to your live DeployX API
DEPLOYX_API_URL=https://your-deployx-api.onrender.com

# Agent local port (leave as 4100 unless another port is in use)
AGENT_PORT=4100

# Container resource limits
CONTAINER_MEMORY_LIMIT=2g
CONTAINER_CPU_LIMIT=2
CONTAINER_PIDS_LIMIT=512

# Build timeout (15 minutes)
BUILD_TIMEOUT_MS=900000

# Startup health-check timeout (10 minutes)
STARTUP_TIMEOUT_MS=600000

# Heartbeat interval
AGENT_HEARTBEAT_INTERVAL_MS=15000
```

---

## Running the Agent

```bash
pnpm --filter agent start
```

The Agent starts at: http://localhost:4100

---

## Pairing

1. Open your DeployX dashboard (cloud).
2. Click **Connect Agent** → a 6-digit pairing code appears.
3. Open http://localhost:4100 in your browser.
4. Enter the 6-digit code and click **Connect**.
5. The dashboard Agent card switches to **Online** within ~15 seconds.

---

## Unpairing

To disconnect this PC from your account:
- In the DeployX dashboard → Agent Card → **Disconnect**

Or from the Agent local UI at http://localhost:4100 → **Unpair**.

---

## Troubleshooting

| Symptom | Cause | Fix |
|:--------|:------|:----|
| Agent shows offline after pairing | DEPLOYX_API_URL incorrect | Verify URL in apps/agent/.env |
| Cannot start Docker containers | Docker Desktop not running | Start Docker Desktop and wait for it to be ready |
| Build timeout | Large project (Next.js) | Increase BUILD_TIMEOUT_MS to 1800000 (30 min) |
| Port conflicts | Another app on 4100 | Set AGENT_PORT to a different port |
| cloudflared not found | Not installed / not in PATH | Install from https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/ |

---

## Security

- The Agent only accepts commands from the DeployX API authenticated with your agent token.
- Student project containers run with strict resource limits (memory, CPU, PIDs).
- The Docker socket is never exposed to project containers.
- Log output is automatically sanitized to remove secrets.
