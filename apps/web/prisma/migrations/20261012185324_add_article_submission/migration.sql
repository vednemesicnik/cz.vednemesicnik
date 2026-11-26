-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Article" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "featuredImageId" TEXT,
    "submittedAt" DATETIME,
    "submittedById" TEXT,
    CONSTRAINT "Article_featuredImageId_fkey" FOREIGN KEY ("featuredImageId") REFERENCES "ArticleImage" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Article_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "Author" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Article" ("content", "createdAt", "excerpt", "featuredImageId", "id", "publishedAt", "slug", "state", "title", "updatedAt") SELECT "content", "createdAt", "excerpt", "featuredImageId", "id", "publishedAt", "slug", "state", "title", "updatedAt" FROM "Article";
DROP TABLE "Article";
ALTER TABLE "new_Article" RENAME TO "Article";
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");
CREATE UNIQUE INDEX "Article_featuredImageId_key" ON "Article"("featuredImageId");
CREATE INDEX "Article_state_publishedAt_idx" ON "Article"("state", "publishedAt");
CREATE INDEX "Article_submittedById_idx" ON "Article"("submittedById");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Only the Coordinator approves and publishes articles (#590, design 07c/07d): the Creator
-- loses `publish own draft` and `review any draft` on articles and submits for review
-- instead. Data-only: the catalog rows stay. Existing drafts are not marked as submitted.
DELETE FROM "_AuthorPermissionToAuthorRole"
WHERE "B" IN (SELECT id FROM "AuthorRole" WHERE name = 'creator')
  AND "A" IN (
    SELECT id
    FROM "AuthorPermission"
    WHERE entity = 'article'
      AND state = 'draft'
      AND (
        (action = 'publish' AND access = 'own')
        OR (action = 'review' AND access = 'any')
      )
  );
