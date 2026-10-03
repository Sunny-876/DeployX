-- Migration: add_user_ownership
-- Safely handles existing projects by assigning them to a system seed account.

-- 1. Create User table first
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- 2. Unique index on email
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- 3. Add userId as NULLABLE first so existing rows don't fail
ALTER TABLE "Project" ADD COLUMN "userId" TEXT;

-- 4. Insert a seed user to own all pre-existing projects
--    Password hash = bcrypt("changeme") so the seed account can log in if needed
INSERT INTO "User" ("id", "email", "name", "passwordHash", "updatedAt")
VALUES (
  'seed-system-user-00000000000',
  'admin@deployx.local',
  'DeployX Admin',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  CURRENT_TIMESTAMP
)
ON CONFLICT ("email") DO NOTHING;

-- 5. Assign all existing ownerless projects to the seed user
UPDATE "Project"
SET "userId" = 'seed-system-user-00000000000'
WHERE "userId" IS NULL;

-- 6. Now make the column NOT NULL
ALTER TABLE "Project" ALTER COLUMN "userId" SET NOT NULL;

-- 7. Add foreign key constraint
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
