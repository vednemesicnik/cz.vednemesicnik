-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ArticleImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "altText" TEXT NOT NULL,
    "description" TEXT,
    "contentType" TEXT,
    "blob" BLOB,
    "version" TEXT,
    "intrinsicWidth" INTEGER,
    "intrinsicHeight" INTEGER,
    "placeholderDataUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "articleId" TEXT NOT NULL,
    CONSTRAINT "ArticleImage_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ArticleImage" ("altText", "articleId", "blob", "contentType", "createdAt", "description", "id", "updatedAt") SELECT "altText", "articleId", "blob", "contentType", "createdAt", "description", "id", "updatedAt" FROM "ArticleImage";
DROP TABLE "ArticleImage";
ALTER TABLE "new_ArticleImage" RENAME TO "ArticleImage";
CREATE INDEX "ArticleImage_articleId_idx" ON "ArticleImage"("articleId");
CREATE TABLE "new_IssueCover" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "altText" TEXT NOT NULL,
    "contentType" TEXT,
    "blob" BLOB,
    "version" TEXT,
    "intrinsicWidth" INTEGER,
    "intrinsicHeight" INTEGER,
    "placeholderDataUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "issueId" TEXT NOT NULL,
    CONSTRAINT "IssueCover_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_IssueCover" ("altText", "blob", "contentType", "createdAt", "id", "issueId", "updatedAt") SELECT "altText", "blob", "contentType", "createdAt", "id", "issueId", "updatedAt" FROM "IssueCover";
DROP TABLE "IssueCover";
ALTER TABLE "new_IssueCover" RENAME TO "IssueCover";
CREATE UNIQUE INDEX "IssueCover_issueId_key" ON "IssueCover"("issueId");
CREATE TABLE "new_PodcastCover" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "altText" TEXT NOT NULL,
    "contentType" TEXT,
    "blob" BLOB,
    "version" TEXT,
    "intrinsicWidth" INTEGER,
    "intrinsicHeight" INTEGER,
    "placeholderDataUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "podcastId" TEXT NOT NULL,
    CONSTRAINT "PodcastCover_podcastId_fkey" FOREIGN KEY ("podcastId") REFERENCES "Podcast" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PodcastCover" ("altText", "blob", "contentType", "createdAt", "id", "podcastId", "updatedAt") SELECT "altText", "blob", "contentType", "createdAt", "id", "podcastId", "updatedAt" FROM "PodcastCover";
DROP TABLE "PodcastCover";
ALTER TABLE "new_PodcastCover" RENAME TO "PodcastCover";
CREATE UNIQUE INDEX "PodcastCover_podcastId_key" ON "PodcastCover"("podcastId");
CREATE TABLE "new_PodcastEpisodeCover" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "altText" TEXT NOT NULL,
    "contentType" TEXT,
    "blob" BLOB,
    "version" TEXT,
    "intrinsicWidth" INTEGER,
    "intrinsicHeight" INTEGER,
    "placeholderDataUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "episodeId" TEXT NOT NULL,
    CONSTRAINT "PodcastEpisodeCover_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "PodcastEpisode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PodcastEpisodeCover" ("altText", "blob", "contentType", "createdAt", "episodeId", "id", "updatedAt") SELECT "altText", "blob", "contentType", "createdAt", "episodeId", "id", "updatedAt" FROM "PodcastEpisodeCover";
DROP TABLE "PodcastEpisodeCover";
ALTER TABLE "new_PodcastEpisodeCover" RENAME TO "PodcastEpisodeCover";
CREATE UNIQUE INDEX "PodcastEpisodeCover_episodeId_key" ON "PodcastEpisodeCover"("episodeId");
CREATE TABLE "new_UserImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "altText" TEXT,
    "contentType" TEXT,
    "blob" BLOB,
    "version" TEXT,
    "intrinsicWidth" INTEGER,
    "intrinsicHeight" INTEGER,
    "placeholderDataUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "UserImage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserImage" ("altText", "blob", "contentType", "createdAt", "id", "updatedAt", "userId") SELECT "altText", "blob", "contentType", "createdAt", "id", "updatedAt", "userId" FROM "UserImage";
DROP TABLE "UserImage";
ALTER TABLE "new_UserImage" RENAME TO "UserImage";
CREATE UNIQUE INDEX "UserImage_userId_key" ON "UserImage"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
