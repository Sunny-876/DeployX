# DeployX Database Production & Backup Guide

This document outlines database configuration, security, and backup strategies for DeployX.

---

## 1. Database Connection Management

DeployX requires PostgreSQL 16+. The connection string is **never hardcoded** in the codebase.
It is read from the `DATABASE_URL` environment variable via Prisma (`prisma.config.ts` and `apps/api/src/prisma/prisma.service.ts`).

### Development
```bash
DATABASE_URL="postgresql://deployx:deployx_password@localhost:5432/deployx?schema=public"
```

### Production
```bash
DATABASE_URL="postgresql://<prod_user>:<prod_password>@<db_host>:5432/<prod_database>?sslmode=require&schema=public&connection_limit=25&pool_timeout=10"
```

### Production Checklist
- **SSL / TLS**: Always append `sslmode=require` or `sslmode=verify-full`.
- **Dedicated User**: Use a dedicated PostgreSQL user with restricted privileges (only CRUD on public schema, no superuser).
- **Connection Pooling**: Configure PgBouncer or connection limits (`connection_limit=25`) to prevent connection exhaustion.
- **Network Isolation**: Ensure the PostgreSQL instance is in a private VPC/subnet, accessible only by the API server.

---

## 2. Backup Strategies

### A. Automated Daily Logical Backup (`pg_dump`)
Run a cron job or scheduled task to take daily dumps:

```bash
# Backup command
pg_dump -h <db_host> -U <prod_user> -d <prod_database> -F c -b -v -f "/var/backups/deployx_$(date +%Y%m%d_%H%M%S).dump"

# S3 / GCS upload example
aws s3 cp "/var/backups/deployx_$(date +%Y%m%d_%H%M%S).dump" s3://deployx-backups/database/
```

### B. Restore Procedure
To restore a backup into a fresh database:

```bash
# 1. Terminate active connections (if restoring existing DB)
psql -h <db_host> -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'deployx_prod';"

# 2. Restore using pg_restore
pg_restore -h <db_host> -U <prod_user> -d <prod_database> --clean --if-exists -v "/var/backups/deployx_YYYYMMDD_HHMMSS.dump"

# 3. Verify Prisma migrations
npx prisma migrate status
```

### C. Retention Policy
- Keep daily backups for 30 days.
- Keep weekly backups for 12 weeks.
- Keep monthly backups for 1 year.
