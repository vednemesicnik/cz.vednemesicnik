-- Rename AuthEvent -> AuthLog, preserving existing rows. Hand-written because
-- Prisma would otherwise drop + recreate the table (losing rows), and SQLite has
-- no ALTER INDEX RENAME, so the indexes are dropped and recreated under their new
-- model-derived names. The event/method columns stay TEXT (enum conversion is a
-- no-op at the DB level), so no data change is needed.

-- RenameTable
ALTER TABLE "AuthEvent" RENAME TO "AuthLog";

-- RenameIndex (drop + recreate; SQLite lacks ALTER INDEX RENAME)
DROP INDEX "AuthEvent_createdAt_idx";
DROP INDEX "AuthEvent_userId_idx";
CREATE INDEX "AuthLog_createdAt_idx" ON "AuthLog"("createdAt");
CREATE INDEX "AuthLog_userId_idx" ON "AuthLog"("userId");
