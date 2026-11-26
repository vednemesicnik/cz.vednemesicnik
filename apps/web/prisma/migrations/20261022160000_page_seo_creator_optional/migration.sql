-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PageSEO" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pathname" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "robots" TEXT NOT NULL DEFAULT 'index, follow',
    "ogImageUrl" TEXT,
    "twitterImageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "authorId" TEXT,
    CONSTRAINT "PageSEO_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PageSEO" ("authorId", "createdAt", "description", "id", "ogImageUrl", "pathname", "publishedAt", "robots", "state", "title", "twitterImageUrl", "updatedAt") SELECT "authorId", "createdAt", "description", "id", "ogImageUrl", "pathname", "publishedAt", "robots", "state", "title", "twitterImageUrl", "updatedAt" FROM "PageSEO";
DROP TABLE "PageSEO";
ALTER TABLE "new_PageSEO" RENAME TO "PageSEO";
CREATE UNIQUE INDEX "PageSEO_pathname_key" ON "PageSEO"("pathname");
CREATE INDEX "PageSEO_authorId_idx" ON "PageSEO"("authorId");
CREATE INDEX "PageSEO_state_authorId_idx" ON "PageSEO"("state", "authorId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

