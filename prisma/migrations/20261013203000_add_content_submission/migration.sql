-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Issue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "releasedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "authorId" TEXT NOT NULL,
    "submittedAt" DATETIME,
    "submittedById" TEXT,
    CONSTRAINT "Issue_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Issue_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "Author" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Issue" ("authorId", "createdAt", "id", "label", "publishedAt", "releasedAt", "state", "updatedAt") SELECT "authorId", "createdAt", "id", "label", "publishedAt", "releasedAt", "state", "updatedAt" FROM "Issue";
DROP TABLE "Issue";
ALTER TABLE "new_Issue" RENAME TO "Issue";
CREATE INDEX "Issue_authorId_idx" ON "Issue"("authorId");
CREATE INDEX "Issue_submittedById_idx" ON "Issue"("submittedById");
CREATE INDEX "Issue_state_authorId_idx" ON "Issue"("state", "authorId");
CREATE INDEX "Issue_state_releasedAt_idx" ON "Issue"("state", "releasedAt");
CREATE TABLE "new_Podcast" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "authorId" TEXT NOT NULL,
    "submittedAt" DATETIME,
    "submittedById" TEXT,
    CONSTRAINT "Podcast_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Podcast_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "Author" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Podcast" ("authorId", "createdAt", "description", "id", "publishedAt", "slug", "state", "title", "updatedAt") SELECT "authorId", "createdAt", "description", "id", "publishedAt", "slug", "state", "title", "updatedAt" FROM "Podcast";
DROP TABLE "Podcast";
ALTER TABLE "new_Podcast" RENAME TO "Podcast";
CREATE UNIQUE INDEX "Podcast_slug_key" ON "Podcast"("slug");
CREATE INDEX "Podcast_authorId_idx" ON "Podcast"("authorId");
CREATE INDEX "Podcast_submittedById_idx" ON "Podcast"("submittedById");
CREATE INDEX "Podcast_state_authorId_idx" ON "Podcast"("state", "authorId");
CREATE INDEX "Podcast_state_publishedAt_idx" ON "Podcast"("state", "publishedAt");
CREATE TABLE "new_PodcastEpisode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "podcastId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "submittedAt" DATETIME,
    "submittedById" TEXT,
    CONSTRAINT "PodcastEpisode_podcastId_fkey" FOREIGN KEY ("podcastId") REFERENCES "Podcast" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PodcastEpisode_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PodcastEpisode_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "Author" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PodcastEpisode" ("authorId", "createdAt", "description", "id", "number", "podcastId", "publishedAt", "slug", "state", "title", "updatedAt") SELECT "authorId", "createdAt", "description", "id", "number", "podcastId", "publishedAt", "slug", "state", "title", "updatedAt" FROM "PodcastEpisode";
DROP TABLE "PodcastEpisode";
ALTER TABLE "new_PodcastEpisode" RENAME TO "PodcastEpisode";
CREATE UNIQUE INDEX "PodcastEpisode_slug_key" ON "PodcastEpisode"("slug");
CREATE INDEX "PodcastEpisode_podcastId_idx" ON "PodcastEpisode"("podcastId");
CREATE INDEX "PodcastEpisode_authorId_idx" ON "PodcastEpisode"("authorId");
CREATE INDEX "PodcastEpisode_submittedById_idx" ON "PodcastEpisode"("submittedById");
CREATE INDEX "PodcastEpisode_state_authorId_idx" ON "PodcastEpisode"("state", "authorId");
CREATE INDEX "PodcastEpisode_state_publishedAt_idx" ON "PodcastEpisode"("state", "publishedAt");
CREATE UNIQUE INDEX "PodcastEpisode_podcastId_number_key" ON "PodcastEpisode"("podcastId", "number");
CREATE TABLE "new_ArticleTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "authorId" TEXT NOT NULL,
    "submittedAt" DATETIME,
    "submittedById" TEXT,
    CONSTRAINT "ArticleTag_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ArticleTag_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "Author" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ArticleTag" ("authorId", "createdAt", "id", "name", "publishedAt", "slug", "state", "updatedAt") SELECT "authorId", "createdAt", "id", "name", "publishedAt", "slug", "state", "updatedAt" FROM "ArticleTag";
DROP TABLE "ArticleTag";
ALTER TABLE "new_ArticleTag" RENAME TO "ArticleTag";
CREATE UNIQUE INDEX "ArticleTag_name_key" ON "ArticleTag"("name");
CREATE UNIQUE INDEX "ArticleTag_slug_key" ON "ArticleTag"("slug");
CREATE INDEX "ArticleTag_authorId_idx" ON "ArticleTag"("authorId");
CREATE INDEX "ArticleTag_submittedById_idx" ON "ArticleTag"("submittedById");
CREATE INDEX "ArticleTag_state_authorId_idx" ON "ArticleTag"("state", "authorId");
CREATE TABLE "new_ArticleCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "authorId" TEXT NOT NULL,
    "submittedAt" DATETIME,
    "submittedById" TEXT,
    CONSTRAINT "ArticleCategory_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ArticleCategory_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "Author" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ArticleCategory" ("authorId", "createdAt", "id", "name", "publishedAt", "slug", "state", "updatedAt") SELECT "authorId", "createdAt", "id", "name", "publishedAt", "slug", "state", "updatedAt" FROM "ArticleCategory";
DROP TABLE "ArticleCategory";
ALTER TABLE "new_ArticleCategory" RENAME TO "ArticleCategory";
CREATE UNIQUE INDEX "ArticleCategory_name_key" ON "ArticleCategory"("name");
CREATE UNIQUE INDEX "ArticleCategory_slug_key" ON "ArticleCategory"("slug");
CREATE INDEX "ArticleCategory_authorId_idx" ON "ArticleCategory"("authorId");
CREATE INDEX "ArticleCategory_submittedById_idx" ON "ArticleCategory"("submittedById");
CREATE INDEX "ArticleCategory_state_authorId_idx" ON "ArticleCategory"("state", "authorId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;


-- Only the Coordinator approves and publishes, any content (#627, design 07c/07d, as #590 did
-- for articles): the Creator loses `publish own draft` and `review any draft` on tags,
-- categories, issues, podcasts and episodes, and submits for review instead. Data-only: the
-- catalog rows stay. Existing drafts are not marked as submitted.
DELETE FROM "_AuthorPermissionToAuthorRole"
WHERE "B" IN (SELECT id FROM "AuthorRole" WHERE name = 'creator')
  AND "A" IN (
    SELECT id
    FROM "AuthorPermission"
    WHERE entity IN ('article_tag', 'article_category', 'issue', 'podcast', 'podcast_episode')
      AND state = 'draft'
      AND (
        (action = 'publish' AND access = 'own')
        OR (action = 'review' AND access = 'any')
      )
  );
