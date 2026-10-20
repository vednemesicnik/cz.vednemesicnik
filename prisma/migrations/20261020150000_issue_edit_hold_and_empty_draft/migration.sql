-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Issue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER,
    "order" INTEGER,
    "name" TEXT,
    "supplement" TEXT,
    "supplementSlug" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "firstContentAt" DATETIME,
    "publishedAt" DATETIME,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "authorId" TEXT NOT NULL,
    "submittedAt" DATETIME,
    "submittedById" TEXT,
    "heldByAuthorId" TEXT,
    "heldByTabId" TEXT,
    "heldSince" DATETIME,
    "heldUntil" DATETIME,
    CONSTRAINT "Issue_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Issue_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "Author" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Issue_heldByAuthorId_fkey" FOREIGN KEY ("heldByAuthorId") REFERENCES "Author" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
-- Backfill: every existing issue has content, so none of them is an empty draft (0020).
INSERT INTO "new_Issue" ("authorId", "createdAt", "firstContentAt", "id", "name", "order", "publishedAt", "state", "submittedAt", "submittedById", "supplement", "supplementSlug", "updatedAt", "year") SELECT "authorId", "createdAt", "createdAt", "id", "name", "order", "publishedAt", "state", "submittedAt", "submittedById", "supplement", "supplementSlug", "updatedAt", "year" FROM "Issue";
DROP TABLE "Issue";
ALTER TABLE "new_Issue" RENAME TO "Issue";
CREATE INDEX "Issue_authorId_idx" ON "Issue"("authorId");
CREATE INDEX "Issue_submittedById_idx" ON "Issue"("submittedById");
CREATE INDEX "Issue_heldByAuthorId_idx" ON "Issue"("heldByAuthorId");
CREATE INDEX "Issue_state_authorId_idx" ON "Issue"("state", "authorId");
CREATE INDEX "Issue_state_year_order_idx" ON "Issue"("state", "year", "order");
CREATE UNIQUE INDEX "Issue_year_order_supplementSlug_key" ON "Issue"("year", "order", "supplementSlug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

