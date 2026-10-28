-- A podcast's address is unique only once published (log 0039): the typed slug is no
-- longer unique, and publish writes the held address to publishedSlug. The podcast gets
-- the empty draft (log 0020) and the edit hold (log 0019) of the editor (27e).

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Podcast" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL DEFAULT '',
    "publishedSlug" TEXT,
    "title" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
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
    CONSTRAINT "Podcast_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Podcast_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "Author" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Podcast_heldByAuthorId_fkey" FOREIGN KEY ("heldByAuthorId") REFERENCES "Author" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
-- Backfill: every existing podcast has content, so none of them is an empty draft (0020).
INSERT INTO "new_Podcast" ("authorId", "createdAt", "description", "firstContentAt", "id", "publishedAt", "slug", "state", "submittedAt", "submittedById", "title", "updatedAt") SELECT "authorId", "createdAt", "description", "createdAt", "id", "publishedAt", "slug", "state", "submittedAt", "submittedById", "title", "updatedAt" FROM "Podcast";
-- Published and archived podcasts, and drafts that were published before (retract keeps
-- publishedAt), hold the address they have.
UPDATE "new_Podcast" SET "publishedSlug" = "slug"
WHERE "state" <> 'draft' OR "publishedAt" IS NOT NULL;
DROP TABLE "Podcast";
ALTER TABLE "new_Podcast" RENAME TO "Podcast";
CREATE UNIQUE INDEX "Podcast_publishedSlug_key" ON "Podcast"("publishedSlug");
CREATE INDEX "Podcast_slug_idx" ON "Podcast"("slug");
CREATE INDEX "Podcast_authorId_idx" ON "Podcast"("authorId");
CREATE INDEX "Podcast_submittedById_idx" ON "Podcast"("submittedById");
CREATE INDEX "Podcast_heldByAuthorId_idx" ON "Podcast"("heldByAuthorId");
CREATE INDEX "Podcast_state_authorId_idx" ON "Podcast"("state", "authorId");
CREATE INDEX "Podcast_state_publishedAt_idx" ON "Podcast"("state", "publishedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
