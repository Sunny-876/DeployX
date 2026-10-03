-- Current-state runtime model.
-- Adds RUNNING / PAUSED / OFFLINE to the deployment status enum and stores the
-- live runtime metadata that the DeployX Agent mirrors from Docker.
-- Postgres 12+ allows ADD VALUE inside the migration transaction as long as the
-- new values are not *used* in the same transaction, which is the case here.

-- AlterEnum
ALTER TYPE "DeploymentStatus" ADD VALUE IF NOT EXISTS 'RUNNING';
ALTER TYPE "DeploymentStatus" ADD VALUE IF NOT EXISTS 'PAUSED';
ALTER TYPE "DeploymentStatus" ADD VALUE IF NOT EXISTS 'OFFLINE';

-- AlterTable
ALTER TABLE "Deployment" ADD COLUMN "containerId" TEXT;
ALTER TABLE "Deployment" ADD COLUMN "containerName" TEXT;
ALTER TABLE "Deployment" ADD COLUMN "port" INTEGER;
ALTER TABLE "Deployment" ADD COLUMN "projectPath" TEXT;
ALTER TABLE "Deployment" ADD COLUMN "lastSyncedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Deployment_projectId_idx" ON "Deployment"("projectId");

-- CreateIndex
CREATE INDEX "Deployment_agentId_idx" ON "Deployment"("agentId");
