-- PageSEO was written and never read (#1011, log 0076). Rows that point at it go
-- first, so no review is left without content and no permission with an entity
-- the client no longer knows.
DELETE FROM "Review" WHERE "pageSEOId" IS NOT NULL;
DELETE FROM "_AuthorPermissionToAuthorRole"
WHERE "A" IN (SELECT "id" FROM "AuthorPermission" WHERE "entity" = 'page_seo');
DELETE FROM "AuthorPermission" WHERE "entity" = 'page_seo';

-- DropIndex
DROP INDEX "PageSEO_state_authorId_idx";

-- DropIndex
DROP INDEX "PageSEO_authorId_idx";

-- DropIndex
DROP INDEX "PageSEO_pathname_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "PageSEO";
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
    "articleTagId" TEXT,
    "articleCategoryId" TEXT,
    CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Review_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_podcastId_fkey" FOREIGN KEY ("podcastId") REFERENCES "Podcast" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_podcastEpisodeId_fkey" FOREIGN KEY ("podcastEpisodeId") REFERENCES "PodcastEpisode" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_articleTagId_fkey" FOREIGN KEY ("articleTagId") REFERENCES "ArticleTag" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_articleCategoryId_fkey" FOREIGN KEY ("articleCategoryId") REFERENCES "ArticleCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Review" ("articleCategoryId", "articleId", "articleTagId", "createdAt", "id", "issueId", "podcastEpisodeId", "podcastId", "reviewerId", "state", "updatedAt") SELECT "articleCategoryId", "articleId", "articleTagId", "createdAt", "id", "issueId", "podcastEpisodeId", "podcastId", "reviewerId", "state", "updatedAt" FROM "Review";
DROP TABLE "Review";
ALTER TABLE "new_Review" RENAME TO "Review";
CREATE INDEX "Review_reviewerId_idx" ON "Review"("reviewerId");
CREATE INDEX "Review_issueId_idx" ON "Review"("issueId");
CREATE INDEX "Review_articleId_idx" ON "Review"("articleId");
CREATE INDEX "Review_podcastId_idx" ON "Review"("podcastId");
CREATE INDEX "Review_podcastEpisodeId_idx" ON "Review"("podcastEpisodeId");
CREATE INDEX "Review_articleTagId_idx" ON "Review"("articleTagId");
CREATE INDEX "Review_articleCategoryId_idx" ON "Review"("articleCategoryId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

