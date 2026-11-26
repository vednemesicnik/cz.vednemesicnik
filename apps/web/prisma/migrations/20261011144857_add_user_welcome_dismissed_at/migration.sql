-- AlterTable
ALTER TABLE "User" ADD COLUMN "welcomeDismissedAt" DATETIME;

-- The welcome row (design 29e) is for invited users; accounts that already
-- exist count as having closed it.
UPDATE "User" SET "welcomeDismissedAt" = CURRENT_TIMESTAMP;
