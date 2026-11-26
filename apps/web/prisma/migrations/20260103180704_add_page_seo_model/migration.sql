-- CreateTable
CREATE TABLE "PageSEO" (
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
    "authorId" TEXT NOT NULL,
    CONSTRAINT "PageSEO_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "podcastEpisodeLinkId" TEXT,
    "articleTagId" TEXT,
    "articleCategoryId" TEXT,
    "editorialBoardPositionId" TEXT,
    "editorialBoardMemberId" TEXT,
    "pageSEOId" TEXT,
    CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Review_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_podcastId_fkey" FOREIGN KEY ("podcastId") REFERENCES "Podcast" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_podcastEpisodeId_fkey" FOREIGN KEY ("podcastEpisodeId") REFERENCES "PodcastEpisode" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_podcastEpisodeLinkId_fkey" FOREIGN KEY ("podcastEpisodeLinkId") REFERENCES "PodcastEpisodeLink" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_articleTagId_fkey" FOREIGN KEY ("articleTagId") REFERENCES "ArticleTag" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_articleCategoryId_fkey" FOREIGN KEY ("articleCategoryId") REFERENCES "ArticleCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_editorialBoardPositionId_fkey" FOREIGN KEY ("editorialBoardPositionId") REFERENCES "EditorialBoardPosition" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_editorialBoardMemberId_fkey" FOREIGN KEY ("editorialBoardMemberId") REFERENCES "EditorialBoardMember" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_pageSEOId_fkey" FOREIGN KEY ("pageSEOId") REFERENCES "PageSEO" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Review" ("articleCategoryId", "articleId", "articleTagId", "createdAt", "editorialBoardMemberId", "editorialBoardPositionId", "id", "issueId", "podcastEpisodeId", "podcastEpisodeLinkId", "podcastId", "reviewerId", "state", "updatedAt") SELECT "articleCategoryId", "articleId", "articleTagId", "createdAt", "editorialBoardMemberId", "editorialBoardPositionId", "id", "issueId", "podcastEpisodeId", "podcastEpisodeLinkId", "podcastId", "reviewerId", "state", "updatedAt" FROM "Review";
DROP TABLE "Review";
ALTER TABLE "new_Review" RENAME TO "Review";
CREATE INDEX "Review_reviewerId_idx" ON "Review"("reviewerId");
CREATE INDEX "Review_issueId_idx" ON "Review"("issueId");
CREATE INDEX "Review_articleId_idx" ON "Review"("articleId");
CREATE INDEX "Review_podcastId_idx" ON "Review"("podcastId");
CREATE INDEX "Review_podcastEpisodeId_idx" ON "Review"("podcastEpisodeId");
CREATE INDEX "Review_podcastEpisodeLinkId_idx" ON "Review"("podcastEpisodeLinkId");
CREATE INDEX "Review_articleTagId_idx" ON "Review"("articleTagId");
CREATE INDEX "Review_articleCategoryId_idx" ON "Review"("articleCategoryId");
CREATE INDEX "Review_editorialBoardPositionId_idx" ON "Review"("editorialBoardPositionId");
CREATE INDEX "Review_editorialBoardMemberId_idx" ON "Review"("editorialBoardMemberId");
CREATE INDEX "Review_pageSEOId_idx" ON "Review"("pageSEOId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PageSEO_pathname_key" ON "PageSEO"("pathname");

-- CreateIndex
CREATE INDEX "PageSEO_authorId_idx" ON "PageSEO"("authorId");
