-- Drop reviews that belonged to podcast episode links before the column is
-- removed by the table rebuild below. Links are no longer a reviewable entity.
DELETE FROM "Review" WHERE "podcastEpisodeLinkId" IS NOT NULL;

-- Remove the retired `podcast_episode_link` permission entity. Explicitly clear
-- the implicit join rows first so the delete does not depend on the FK pragma
-- state during migration.
DELETE FROM "_AuthorPermissionToAuthorRole"
WHERE "A" IN (SELECT "id" FROM "AuthorPermission" WHERE "entity" = 'podcast_episode_link');
DELETE FROM "AuthorPermission" WHERE "entity" = 'podcast_episode_link';

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PodcastEpisodeLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "episodeId" TEXT NOT NULL,
    CONSTRAINT "PodcastEpisodeLink_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "PodcastEpisode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PodcastEpisodeLink" ("createdAt", "episodeId", "id", "label", "updatedAt", "url") SELECT "createdAt", "episodeId", "id", "label", "updatedAt", "url" FROM "PodcastEpisodeLink";
DROP TABLE "PodcastEpisodeLink";
ALTER TABLE "new_PodcastEpisodeLink" RENAME TO "PodcastEpisodeLink";
CREATE INDEX "PodcastEpisodeLink_episodeId_idx" ON "PodcastEpisodeLink"("episodeId");
CREATE TABLE "new_Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "state" TEXT NOT NULL DEFAULT 'approved',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "issueId" TEXT,
    "articleId" TEXT,
    "podcastId" TEXT,
    "podcastEpisodeId" TEXT,
    "articleTagId" TEXT,
    "articleCategoryId" TEXT,
    "pageSEOId" TEXT,
    CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Review_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_podcastId_fkey" FOREIGN KEY ("podcastId") REFERENCES "Podcast" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_podcastEpisodeId_fkey" FOREIGN KEY ("podcastEpisodeId") REFERENCES "PodcastEpisode" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_articleTagId_fkey" FOREIGN KEY ("articleTagId") REFERENCES "ArticleTag" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_articleCategoryId_fkey" FOREIGN KEY ("articleCategoryId") REFERENCES "ArticleCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_pageSEOId_fkey" FOREIGN KEY ("pageSEOId") REFERENCES "PageSEO" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Review" ("articleCategoryId", "articleId", "articleTagId", "createdAt", "id", "issueId", "pageSEOId", "podcastEpisodeId", "podcastId", "reviewerId", "state", "updatedAt") SELECT "articleCategoryId", "articleId", "articleTagId", "createdAt", "id", "issueId", "pageSEOId", "podcastEpisodeId", "podcastId", "reviewerId", "state", "updatedAt" FROM "Review";
DROP TABLE "Review";
ALTER TABLE "new_Review" RENAME TO "Review";
CREATE INDEX "Review_reviewerId_idx" ON "Review"("reviewerId");
CREATE INDEX "Review_issueId_idx" ON "Review"("issueId");
CREATE INDEX "Review_articleId_idx" ON "Review"("articleId");
CREATE INDEX "Review_podcastId_idx" ON "Review"("podcastId");
CREATE INDEX "Review_podcastEpisodeId_idx" ON "Review"("podcastEpisodeId");
CREATE INDEX "Review_articleTagId_idx" ON "Review"("articleTagId");
CREATE INDEX "Review_articleCategoryId_idx" ON "Review"("articleCategoryId");
CREATE INDEX "Review_pageSEOId_idx" ON "Review"("pageSEOId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
