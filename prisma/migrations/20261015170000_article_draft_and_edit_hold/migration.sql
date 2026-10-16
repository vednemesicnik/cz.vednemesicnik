-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Article" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "firstContentAt" DATETIME,
    "publishedAt" DATETIME,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "featuredImageId" TEXT,
    "submittedAt" DATETIME,
    "submittedById" TEXT,
    "heldByAuthorId" TEXT,
    "heldByTabId" TEXT,
    "heldSince" DATETIME,
    "heldUntil" DATETIME,
    CONSTRAINT "Article_featuredImageId_fkey" FOREIGN KEY ("featuredImageId") REFERENCES "ArticleImage" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Article_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "Author" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Article_heldByAuthorId_fkey" FOREIGN KEY ("heldByAuthorId") REFERENCES "Author" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Article" ("content", "createdAt", "excerpt", "featuredImageId", "id", "publishedAt", "slug", "state", "submittedAt", "submittedById", "title", "updatedAt") SELECT "content", "createdAt", "excerpt", "featuredImageId", "id", "publishedAt", "slug", "state", "submittedAt", "submittedById", "title", "updatedAt" FROM "Article";
DROP TABLE "Article";
ALTER TABLE "new_Article" RENAME TO "Article";
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");
CREATE UNIQUE INDEX "Article_featuredImageId_key" ON "Article"("featuredImageId");
CREATE INDEX "Article_state_publishedAt_idx" ON "Article"("state", "publishedAt");
CREATE INDEX "Article_submittedById_idx" ON "Article"("submittedById");
CREATE INDEX "Article_heldByAuthorId_idx" ON "Article"("heldByAuthorId");
CREATE TABLE "new_ArticleImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "altText" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT NOT NULL,
    "intrinsicWidth" INTEGER NOT NULL,
    "intrinsicHeight" INTEGER NOT NULL,
    "placeholderDataUrl" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "articleId" TEXT NOT NULL,
    CONSTRAINT "ArticleImage_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ArticleImage" ("altText", "articleId", "createdAt", "description", "id", "intrinsicHeight", "intrinsicWidth", "placeholderDataUrl", "updatedAt", "version") SELECT "altText", "articleId", "createdAt", "description", "id", "intrinsicHeight", "intrinsicWidth", "placeholderDataUrl", "updatedAt", "version" FROM "ArticleImage";
DROP TABLE "ArticleImage";
ALTER TABLE "new_ArticleImage" RENAME TO "ArticleImage";
CREATE INDEX "ArticleImage_articleId_idx" ON "ArticleImage"("articleId");
-- Every existing article has content (decision 0020): its first content is its creation.
UPDATE "Article" SET "firstContentAt" = "createdAt";
-- Existing images keep the order they were shown in (createdAt, then id).
UPDATE "ArticleImage" SET "position" = (
    SELECT "ranked"."rank" FROM (
        SELECT "id", ROW_NUMBER() OVER (PARTITION BY "articleId" ORDER BY "createdAt", "id") - 1 AS "rank"
        FROM "ArticleImage"
    ) AS "ranked"
    WHERE "ranked"."id" = "ArticleImage"."id"
);
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
