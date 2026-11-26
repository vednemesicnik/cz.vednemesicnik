/*
  Warnings:

  - You are about to drop the column `authorId` on the `Article` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "_ArticleAuthors" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ArticleAuthors_A_fkey" FOREIGN KEY ("A") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ArticleAuthors_B_fkey" FOREIGN KEY ("B") REFERENCES "Author" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    CONSTRAINT "Article_featuredImageId_fkey" FOREIGN KEY ("featuredImageId") REFERENCES "ArticleImage" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Article" ("content", "createdAt", "excerpt", "featuredImageId", "id", "publishedAt", "slug", "state", "title", "updatedAt") SELECT "content", "createdAt", "excerpt", "featuredImageId", "id", "publishedAt", "slug", "state", "title", "updatedAt" FROM "Article";
-- Migrate existing author relations to the join table
INSERT INTO "_ArticleAuthors" ("A", "B") SELECT "id", "authorId" FROM "Article";
DROP TABLE "Article";
ALTER TABLE "new_Article" RENAME TO "Article";
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");
CREATE UNIQUE INDEX "Article_featuredImageId_key" ON "Article"("featuredImageId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_ArticleAuthors_AB_unique" ON "_ArticleAuthors"("A", "B");

-- CreateIndex
CREATE INDEX "_ArticleAuthors_B_index" ON "_ArticleAuthors"("B");
