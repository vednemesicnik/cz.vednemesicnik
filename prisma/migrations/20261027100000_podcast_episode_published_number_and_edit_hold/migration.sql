-- An episode's number is unique within its podcast only once published (log 0039): the
-- typed number is no longer unique, and publish writes the held one to publishedNumber.
-- The episode gets the empty draft (log 0020) and the edit hold (log 0019) of the editor (27d).

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PodcastEpisode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL DEFAULT '',
    "publishedSlug" TEXT,
    "number" INTEGER,
    "publishedNumber" INTEGER,
    "title" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "firstContentAt" DATETIME,
    "publishedAt" DATETIME,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "podcastId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "submittedAt" DATETIME,
    "submittedById" TEXT,
    "heldByAuthorId" TEXT,
    "heldByTabId" TEXT,
    "heldSince" DATETIME,
    "heldUntil" DATETIME,
    CONSTRAINT "PodcastEpisode_podcastId_fkey" FOREIGN KEY ("podcastId") REFERENCES "Podcast" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PodcastEpisode_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PodcastEpisode_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "Author" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PodcastEpisode_heldByAuthorId_fkey" FOREIGN KEY ("heldByAuthorId") REFERENCES "Author" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
-- Backfill: every existing episode has content, so none of them is an empty draft (0020).
INSERT INTO "new_PodcastEpisode" ("authorId", "createdAt", "description", "firstContentAt", "id", "number", "podcastId", "publishedAt", "publishedSlug", "slug", "state", "submittedAt", "submittedById", "title", "updatedAt") SELECT "authorId", "createdAt", "description", "createdAt", "id", "number", "podcastId", "publishedAt", "publishedSlug", "slug", "state", "submittedAt", "submittedById", "title", "updatedAt" FROM "PodcastEpisode";
-- Published and archived episodes, and drafts that were published before (retract keeps
-- publishedAt), hold the number they have.
UPDATE "new_PodcastEpisode" SET "publishedNumber" = "number"
WHERE "state" <> 'draft' OR "publishedAt" IS NOT NULL;
DROP TABLE "PodcastEpisode";
ALTER TABLE "new_PodcastEpisode" RENAME TO "PodcastEpisode";
CREATE INDEX "PodcastEpisode_podcastId_number_idx" ON "PodcastEpisode"("podcastId", "number");
CREATE INDEX "PodcastEpisode_podcastId_slug_idx" ON "PodcastEpisode"("podcastId", "slug");
CREATE INDEX "PodcastEpisode_podcastId_idx" ON "PodcastEpisode"("podcastId");
CREATE INDEX "PodcastEpisode_authorId_idx" ON "PodcastEpisode"("authorId");
CREATE INDEX "PodcastEpisode_submittedById_idx" ON "PodcastEpisode"("submittedById");
CREATE INDEX "PodcastEpisode_heldByAuthorId_idx" ON "PodcastEpisode"("heldByAuthorId");
CREATE INDEX "PodcastEpisode_state_authorId_idx" ON "PodcastEpisode"("state", "authorId");
CREATE INDEX "PodcastEpisode_state_publishedAt_idx" ON "PodcastEpisode"("state", "publishedAt");
CREATE UNIQUE INDEX "PodcastEpisode_podcastId_publishedNumber_key" ON "PodcastEpisode"("podcastId", "publishedNumber");
CREATE UNIQUE INDEX "PodcastEpisode_podcastId_publishedSlug_key" ON "PodcastEpisode"("podcastId", "publishedSlug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

