/*
  Warnings:

  - You are about to drop the `EditorialBoardMember` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EditorialBoardPosition` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_EditorialBoardMemberToEditorialBoardPosition` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `editorialBoardMemberId` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `editorialBoardPositionId` on the `Review` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "EditorialBoardMember_authorId_idx";

-- DropIndex
DROP INDEX "EditorialBoardPosition_authorId_idx";

-- DropIndex
DROP INDEX "EditorialBoardPosition_order_key";

-- DropIndex
DROP INDEX "EditorialBoardPosition_key_key";

-- DropIndex
DROP INDEX "_EditorialBoardMemberToEditorialBoardPosition_B_index";

-- DropIndex
DROP INDEX "_EditorialBoardMemberToEditorialBoardPosition_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "EditorialBoardMember";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "EditorialBoardPosition";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_EditorialBoardMemberToEditorialBoardPosition";
PRAGMA foreign_keys=on;

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
    "pageSEOId" TEXT,
    CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Review_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_podcastId_fkey" FOREIGN KEY ("podcastId") REFERENCES "Podcast" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_podcastEpisodeId_fkey" FOREIGN KEY ("podcastEpisodeId") REFERENCES "PodcastEpisode" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_podcastEpisodeLinkId_fkey" FOREIGN KEY ("podcastEpisodeLinkId") REFERENCES "PodcastEpisodeLink" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_articleTagId_fkey" FOREIGN KEY ("articleTagId") REFERENCES "ArticleTag" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_articleCategoryId_fkey" FOREIGN KEY ("articleCategoryId") REFERENCES "ArticleCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_pageSEOId_fkey" FOREIGN KEY ("pageSEOId") REFERENCES "PageSEO" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Review" ("articleCategoryId", "articleId", "articleTagId", "createdAt", "id", "issueId", "pageSEOId", "podcastEpisodeId", "podcastEpisodeLinkId", "podcastId", "reviewerId", "state", "updatedAt") SELECT "articleCategoryId", "articleId", "articleTagId", "createdAt", "id", "issueId", "pageSEOId", "podcastEpisodeId", "podcastEpisodeLinkId", "podcastId", "reviewerId", "state", "updatedAt" FROM "Review";
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
CREATE INDEX "Review_pageSEOId_idx" ON "Review"("pageSEOId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
