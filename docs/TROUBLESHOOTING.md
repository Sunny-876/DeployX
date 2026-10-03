# DeployX Troubleshooting Guide

---

## API / Backend

### "Cannot connect to database"
- Check `DATABASE_URL` in the API environment.
- Verify the Neon/Supabase database is active (serverless databases sleep after inactivity).
- Add `?sslmode=require&connection_limit=25` to the connection string.

### API returns 500 on startup
- Run `pnpm --filter api exec prisma migrate deploy` to ensure migrations are applied.
- Check Render logs for the exact error.

### CORS errors in browser (blocked by CORS policy)
- Verify `CORS_ALLOWED_ORIGINS` in the API env includes your exact Vercel URL.
- No trailing slash. Example: `https://deployx.vercel.app`
- Vercel preview URLs are different from production URLs - add them if needed.

### Login/register works locally but cookies not sent on Vercel
- Verify `NODE_ENV=production` is set on Render.
- The API sets `sameSite: 'none', secure: true` only when `NODE_ENV === 'production'`.
- Ensure `CORS_ALLOWED_ORIGINS` includes the Vercel URL exactly.

---

## Dashboard

### Dashboard shows blank or errors
- Check `NEXT_PUBLIC_API_URL` is set in Vercel environment variables.
- It must be the full HTTPS URL: `https://deployx-api.onrender.com`

### Vercel build fails
- Verify `vercel.json` is at the repository root.
- Ensure `NEXT_PUBLIC_API_URL` is configured in the Vercel project settings.

---

## Agent

### Agent shows "Offline" after pairing
- Ensure `DEPLOYX_API_URL` in `apps/agent/.env` points to the production API.
- Check the Agent is running: open http://localhost:4100
- The Agent sends a heartbeat every 15 seconds. Wait up to 30 seconds after startup.

### Pairing code rejected
- Pairing codes expire after 10 minutes. Generate a new one from the dashboard.
- Codes are single-use. Each pair attempt needs a fresh code.

### Docker containers not starting
- Docker Desktop must be running.
- Run `docker ps` to verify Docker is accessible.
- Check Windows Firewall is not blocking Docker.

### Build hangs / timeout
- Increase `BUILD_TIMEOUT_MS` in `apps/agent/.env` (default: 900000 = 15 min).
- Large Next.js projects can take 10+ minutes on first install.
- Check `STARTUP_TIMEOUT_MS` (default: 600000 = 10 min for health check).

### Public URL not generated
- Verify `cloudflared` is in system PATH: `cloudflared --version`
- Download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/

### Port already in use (EADDRINUSE)
Stop any running Node.js processes:
```powershell
# Check what is using a port
netstat -ano | findstr :4000
netstat -ano | findstr :4100

# Kill by PID
taskkill /PID <pid> /F
```

---

## Database Migrations

### Migration fails in production
- Never use `prisma db push` in production.
- Always use `prisma migrate deploy` which applies existing migration files safely.
- If a migration conflict exists, create a new forward-fixing migration.

---

## Common Render Issues

### Free tier service sleeps
- Render free tier services sleep after 15 minutes of inactivity.
- First request after sleep takes 30-60 seconds (cold start).
- Upgrade to paid tier for always-on availability.

### Build command fails on Render
- Render uses the build command: `corepack enable && corepack prepare pnpm@latest --activate && pnpm install --frozen-lockfile && pnpm --filter api exec prisma migrate deploy && pnpm --filter api build`
- Ensure `pnpm-lock.yaml` is committed to the repository.
- `--frozen-lockfile` will fail if the lockfile is out of date locally.
