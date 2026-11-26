-- AlterTable
ALTER TABLE "Passkey" ADD COLUMN "lastUsedAt" DATETIME;
ALTER TABLE "Passkey" ADD COLUMN "name" TEXT;

-- Backfill: the sign-in counter update was the only write to Passkey, so an
-- updatedAt past createdAt is the last passkey sign-in.
UPDATE "Passkey" SET "lastUsedAt" = "updatedAt" WHERE "updatedAt" > "createdAt";
