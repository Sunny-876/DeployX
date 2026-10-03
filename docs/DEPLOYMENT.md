# DeployX Production Deployment Guide

## Step-by-Step: Go Live

### Step 0: Prerequisites

You need accounts at:
- [GitHub](https://github.com) - source control
- [Neon](https://neon.tech) or [Supabase](https://supabase.com) - free PostgreSQL
- [Render](https://render.com) - free Node.js API hosting
- [Vercel](https://vercel.com) - free Next.js dashboard hosting

---

### Step 1: Push to GitHub

```bash
cd D:\DeployX
git remote add origin https://github.com/YOUR_USERNAME/deployx.git
git push -u origin main
```

---

### Step 2: Set Up Database (Neon)

1. Create a free account at https://neon.tech
2. Create a new project: `deployx-prod`
3. Go to **Connection Details** -> copy the **Pooled connection string**
4. It looks like:
   ```
   postgresql://deployx_owner:PASSWORD@ep-XXX.us-east-2.aws.neon.tech/deployx?sslmode=require
   ```
5. Save this as `DATABASE_URL` - you will need it in the next step.

---

### Step 3: Deploy API on Render

Option A - Blueprint (automatic, recommended):
1. Go to https://dashboard.render.com -> **New** -> **Blueprint**
2. Connect your GitHub repository
3. Render detects `render.yaml` and creates the service automatically
4. Fill in the required secrets when prompted:
   - `DATABASE_URL` - your Neon connection string
   - `CORS_ALLOWED_ORIGINS` - leave blank for now (set after Vercel deploy)

Option B - Manual Web Service:
1. Go to https://dashboard.render.com -> **New** -> **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `deployx-api`
   - **Root Directory**: `.` (repo root)
   - **Build Command**: `corepack enable && corepack prepare pnpm@latest --activate && pnpm install --frozen-lockfile && pnpm --filter api exec prisma migrate deploy && pnpm --filter api build`
   - **Start Command**: `node apps/api/dist/main.js`
   - **Node Version**: `22`
4. Add environment variables:
   - `NODE_ENV=production`
   - `DATABASE_URL=<your Neon connection string>`
   - `JWT_SECRET=<random 32+ char string>`
   - `CORS_ALLOWED_ORIGINS=` (fill in after Vercel deploy)
5. Click **Create Web Service**

Wait for the first deploy to complete (3-5 minutes).

Verify: `GET https://deployx-api.onrender.com/health` -> `{"status":"ok"}`

---

### Step 4: Deploy Dashboard on Vercel

1. Go to https://vercel.com -> **New Project**
2. Import your GitHub repository
3. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/dashboard`
4. Add Environment Variables:
   - `NEXT_PUBLIC_API_URL=https://deployx-api.onrender.com`  (your Render URL)
5. Click **Deploy**

After deployment you get a URL like: `https://deployx.vercel.app`

---

### Step 5: Update CORS

Go back to your Render service -> **Environment** tab.
Set:
```
CORS_ALLOWED_ORIGINS=https://deployx.vercel.app
```
Save and redeploy.

---

### Step 6: Test End-to-End

1. Open your Vercel URL in a browser
2. Register a new account
3. Log in
4. Navigate to the dashboard - you should see the Agent card showing "Offline"
5. Proceed to set up the Agent on your local PC (see docs/AGENT.md)

---

## Environment Variable Reference

### API (Render)

| Variable | Required | Example |
|:---------|:---------|:--------|
| `NODE_ENV` | Yes | `production` |
| `DATABASE_URL` | Yes | `postgresql://...?sslmode=require` |
| `JWT_SECRET` | Yes | 32+ random chars |
| `CORS_ALLOWED_ORIGINS` | Yes | `https://deployx.vercel.app` |
| `AGENT_PAIRING_TTL_MS` | No | `600000` |
| `AGENT_HEARTBEAT_INTERVAL_MS` | No | `15000` |
| `AGENT_OFFLINE_AFTER_MS` | No | `45000` |

### Dashboard (Vercel)

| Variable | Required | Example |
|:---------|:---------|:--------|
| `NEXT_PUBLIC_API_URL` | Yes | `https://deployx-api.onrender.com` |

### Agent (Student PC)

| Variable | Required | Example |
|:---------|:---------|:--------|
| `DEPLOYX_API_URL` | Yes | `https://deployx-api.onrender.com` |
| `AGENT_PORT` | No | `4100` |

---

## Updating Production

```bash
# Make changes locally
git add .
git commit -m "feat: your change"
git push origin main
```

Render and Vercel automatically redeploy on every push to `main`.
