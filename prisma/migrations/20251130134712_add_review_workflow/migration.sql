-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Article" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "Article_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Article_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Article" ("authorId", "content", "createdAt", "id", "publishedAt", "slug", "state", "title", "updatedAt") SELECT "authorId", "content", "createdAt", "id", "publishedAt", "slug", "state", "title", "updatedAt" FROM "Article";
DROP TABLE "Article";
ALTER TABLE "new_Article" RENAME TO "Article";
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");
CREATE INDEX "Article_authorId_idx" ON "Article"("authorId");
CREATE INDEX "Article_reviewedById_idx" ON "Article"("reviewedById");
CREATE TABLE "new_ArticleCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "ArticleCategory_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ArticleCategory_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ArticleCategory" ("authorId", "createdAt", "id", "name", "publishedAt", "slug", "state", "updatedAt") SELECT "authorId", "createdAt", "id", "name", "publishedAt", "slug", "state", "updatedAt" FROM "ArticleCategory";
DROP TABLE "ArticleCategory";
ALTER TABLE "new_ArticleCategory" RENAME TO "ArticleCategory";
CREATE UNIQUE INDEX "ArticleCategory_name_key" ON "ArticleCategory"("name");
CREATE UNIQUE INDEX "ArticleCategory_slug_key" ON "ArticleCategory"("slug");
CREATE INDEX "ArticleCategory_authorId_idx" ON "ArticleCategory"("authorId");
CREATE INDEX "ArticleCategory_reviewedById_idx" ON "ArticleCategory"("reviewedById");
CREATE TABLE "new_ArticleTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "ArticleTag_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ArticleTag_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ArticleTag" ("authorId", "createdAt", "id", "name", "publishedAt", "slug", "state", "updatedAt") SELECT "authorId", "createdAt", "id", "name", "publishedAt", "slug", "state", "updatedAt" FROM "ArticleTag";
DROP TABLE "ArticleTag";
ALTER TABLE "new_ArticleTag" RENAME TO "ArticleTag";
CREATE UNIQUE INDEX "ArticleTag_name_key" ON "ArticleTag"("name");
CREATE UNIQUE INDEX "ArticleTag_slug_key" ON "ArticleTag"("slug");
CREATE INDEX "ArticleTag_authorId_idx" ON "ArticleTag"("authorId");
CREATE INDEX "ArticleTag_reviewedById_idx" ON "ArticleTag"("reviewedById");
CREATE TABLE "new_Issue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "releasedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "Issue_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Issue_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Issue" ("authorId", "createdAt", "id", "label", "publishedAt", "releasedAt", "state", "updatedAt") SELECT "authorId", "createdAt", "id", "label", "publishedAt", "releasedAt", "state", "updatedAt" FROM "Issue";
DROP TABLE "Issue";
ALTER TABLE "new_Issue" RENAME TO "Issue";
CREATE INDEX "Issue_authorId_idx" ON "Issue"("authorId");
CREATE INDEX "Issue_reviewedById_idx" ON "Issue"("reviewedById");
CREATE TABLE "new_Podcast" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "Podcast_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Podcast_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Podcast" ("authorId", "createdAt", "description", "id", "publishedAt", "slug", "state", "title", "updatedAt") SELECT "authorId", "createdAt", "description", "id", "publishedAt", "slug", "state", "title", "updatedAt" FROM "Podcast";
DROP TABLE "Podcast";
ALTER TABLE "new_Podcast" RENAME TO "Podcast";
CREATE UNIQUE INDEX "Podcast_slug_key" ON "Podcast"("slug");
CREATE INDEX "Podcast_authorId_idx" ON "Podcast"("authorId");
CREATE INDEX "Podcast_reviewedById_idx" ON "Podcast"("reviewedById");
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
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "podcastId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "PodcastEpisode_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PodcastEpisode_podcastId_fkey" FOREIGN KEY ("podcastId") REFERENCES "Podcast" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PodcastEpisode_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PodcastEpisode" ("authorId", "createdAt", "description", "id", "number", "podcastId", "publishedAt", "slug", "state", "title", "updatedAt") SELECT "authorId", "createdAt", "description", "id", "number", "podcastId", "publishedAt", "slug", "state", "title", "updatedAt" FROM "PodcastEpisode";
DROP TABLE "PodcastEpisode";
ALTER TABLE "new_PodcastEpisode" RENAME TO "PodcastEpisode";
CREATE UNIQUE INDEX "PodcastEpisode_slug_key" ON "PodcastEpisode"("slug");
CREATE INDEX "PodcastEpisode_podcastId_idx" ON "PodcastEpisode"("podcastId");
CREATE INDEX "PodcastEpisode_authorId_idx" ON "PodcastEpisode"("authorId");
CREATE INDEX "PodcastEpisode_reviewedById_idx" ON "PodcastEpisode"("reviewedById");
CREATE UNIQUE INDEX "PodcastEpisode_podcastId_number_key" ON "PodcastEpisode"("podcastId", "number");
CREATE TABLE "new_PodcastEpisodeLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "episodeId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "PodcastEpisodeLink_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PodcastEpisodeLink_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "PodcastEpisode" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PodcastEpisodeLink_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PodcastEpisodeLink" ("authorId", "createdAt", "episodeId", "id", "label", "publishedAt", "state", "updatedAt", "url") SELECT "authorId", "createdAt", "episodeId", "id", "label", "publishedAt", "state", "updatedAt", "url" FROM "PodcastEpisodeLink";
DROP TABLE "PodcastEpisodeLink";
ALTER TABLE "new_PodcastEpisodeLink" RENAME TO "PodcastEpisodeLink";
CREATE INDEX "PodcastEpisodeLink_episodeId_idx" ON "PodcastEpisodeLink"("episodeId");
CREATE INDEX "PodcastEpisodeLink_authorId_idx" ON "PodcastEpisodeLink"("authorId");
CREATE INDEX "PodcastEpisodeLink_reviewedById_idx" ON "PodcastEpisodeLink"("reviewedById");

-- Manually insert new author permissions data


PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
