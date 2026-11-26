/*
  Warnings:

  - You are about to drop the column `blob` on the `ArticleImage` table. All the data in the column will be lost.
  - You are about to drop the column `contentType` on the `ArticleImage` table. All the data in the column will be lost.
  - You are about to drop the column `blob` on the `IssueCover` table. All the data in the column will be lost.
  - You are about to drop the column `contentType` on the `IssueCover` table. All the data in the column will be lost.
  - You are about to drop the column `blob` on the `PodcastCover` table. All the data in the column will be lost.
  - You are about to drop the column `contentType` on the `PodcastCover` table. All the data in the column will be lost.
  - You are about to drop the column `blob` on the `PodcastEpisodeCover` table. All the data in the column will be lost.
  - You are about to drop the column `contentType` on the `PodcastEpisodeCover` table. All the data in the column will be lost.
  - You are about to drop the column `blob` on the `UserImage` table. All the data in the column will be lost.
  - You are about to drop the column `contentType` on the `UserImage` table. All the data in the column will be lost.
  - Made the column `intrinsicHeight` on table `ArticleImage` required. This step will fail if there are existing NULL values in that column.
  - Made the column `intrinsicWidth` on table `ArticleImage` required. This step will fail if there are existing NULL values in that column.
  - Made the column `placeholderDataUrl` on table `ArticleImage` required. This step will fail if there are existing NULL values in that column.
  - Made the column `version` on table `ArticleImage` required. This step will fail if there are existing NULL values in that column.
  - Made the column `intrinsicHeight` on table `IssueCover` required. This step will fail if there are existing NULL values in that column.
  - Made the column `intrinsicWidth` on table `IssueCover` required. This step will fail if there are existing NULL values in that column.
  - Made the column `placeholderDataUrl` on table `IssueCover` required. This step will fail if there are existing NULL values in that column.
  - Made the column `version` on table `IssueCover` required. This step will fail if there are existing NULL values in that column.
  - Made the column `intrinsicHeight` on table `PodcastCover` required. This step will fail if there are existing NULL values in that column.
  - Made the column `intrinsicWidth` on table `PodcastCover` required. This step will fail if there are existing NULL values in that column.
  - Made the column `placeholderDataUrl` on table `PodcastCover` required. This step will fail if there are existing NULL values in that column.
  - Made the column `version` on table `PodcastCover` required. This step will fail if there are existing NULL values in that column.
  - Made the column `intrinsicHeight` on table `PodcastEpisodeCover` required. This step will fail if there are existing NULL values in that column.
  - Made the column `intrinsicWidth` on table `PodcastEpisodeCover` required. This step will fail if there are existing NULL values in that column.
  - Made the column `placeholderDataUrl` on table `PodcastEpisodeCover` required. This step will fail if there are existing NULL values in that column.
  - Made the column `version` on table `PodcastEpisodeCover` required. This step will fail if there are existing NULL values in that column.
  - Made the column `intrinsicHeight` on table `UserImage` required. This step will fail if there are existing NULL values in that column.
  - Made the column `intrinsicWidth` on table `UserImage` required. This step will fail if there are existing NULL values in that column.
  - Made the column `placeholderDataUrl` on table `UserImage` required. This step will fail if there are existing NULL values in that column.
  - Made the column `version` on table `UserImage` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ArticleImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "altText" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT NOT NULL,
    "intrinsicWidth" INTEGER NOT NULL,
    "intrinsicHeight" INTEGER NOT NULL,
    "placeholderDataUrl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "articleId" TEXT NOT NULL,
    CONSTRAINT "ArticleImage_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ArticleImage" ("altText", "articleId", "createdAt", "description", "id", "intrinsicHeight", "intrinsicWidth", "placeholderDataUrl", "updatedAt", "version") SELECT "altText", "articleId", "createdAt", "description", "id", "intrinsicHeight", "intrinsicWidth", "placeholderDataUrl", "updatedAt", "version" FROM "ArticleImage";
DROP TABLE "ArticleImage";
ALTER TABLE "new_ArticleImage" RENAME TO "ArticleImage";
CREATE INDEX "ArticleImage_articleId_idx" ON "ArticleImage"("articleId");
CREATE TABLE "new_IssueCover" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "altText" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "intrinsicWidth" INTEGER NOT NULL,
    "intrinsicHeight" INTEGER NOT NULL,
    "placeholderDataUrl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "issueId" TEXT NOT NULL,
    CONSTRAINT "IssueCover_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_IssueCover" ("altText", "createdAt", "id", "intrinsicHeight", "intrinsicWidth", "issueId", "placeholderDataUrl", "updatedAt", "version") SELECT "altText", "createdAt", "id", "intrinsicHeight", "intrinsicWidth", "issueId", "placeholderDataUrl", "updatedAt", "version" FROM "IssueCover";
DROP TABLE "IssueCover";
ALTER TABLE "new_IssueCover" RENAME TO "IssueCover";
CREATE UNIQUE INDEX "IssueCover_issueId_key" ON "IssueCover"("issueId");
CREATE TABLE "new_PodcastCover" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "altText" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "intrinsicWidth" INTEGER NOT NULL,
    "intrinsicHeight" INTEGER NOT NULL,
    "placeholderDataUrl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "podcastId" TEXT NOT NULL,
    CONSTRAINT "PodcastCover_podcastId_fkey" FOREIGN KEY ("podcastId") REFERENCES "Podcast" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PodcastCover" ("altText", "createdAt", "id", "intrinsicHeight", "intrinsicWidth", "placeholderDataUrl", "podcastId", "updatedAt", "version") SELECT "altText", "createdAt", "id", "intrinsicHeight", "intrinsicWidth", "placeholderDataUrl", "podcastId", "updatedAt", "version" FROM "PodcastCover";
DROP TABLE "PodcastCover";
ALTER TABLE "new_PodcastCover" RENAME TO "PodcastCover";
CREATE UNIQUE INDEX "PodcastCover_podcastId_key" ON "PodcastCover"("podcastId");
CREATE TABLE "new_PodcastEpisodeCover" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "altText" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "intrinsicWidth" INTEGER NOT NULL,
    "intrinsicHeight" INTEGER NOT NULL,
    "placeholderDataUrl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "episodeId" TEXT NOT NULL,
    CONSTRAINT "PodcastEpisodeCover_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "PodcastEpisode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PodcastEpisodeCover" ("altText", "createdAt", "episodeId", "id", "intrinsicHeight", "intrinsicWidth", "placeholderDataUrl", "updatedAt", "version") SELECT "altText", "createdAt", "episodeId", "id", "intrinsicHeight", "intrinsicWidth", "placeholderDataUrl", "updatedAt", "version" FROM "PodcastEpisodeCover";
DROP TABLE "PodcastEpisodeCover";
ALTER TABLE "new_PodcastEpisodeCover" RENAME TO "PodcastEpisodeCover";
CREATE UNIQUE INDEX "PodcastEpisodeCover_episodeId_key" ON "PodcastEpisodeCover"("episodeId");
CREATE TABLE "new_UserImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "altText" TEXT,
    "version" TEXT NOT NULL,
    "intrinsicWidth" INTEGER NOT NULL,
    "intrinsicHeight" INTEGER NOT NULL,
    "placeholderDataUrl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "UserImage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserImage" ("altText", "createdAt", "id", "intrinsicHeight", "intrinsicWidth", "placeholderDataUrl", "updatedAt", "userId", "version") SELECT "altText", "createdAt", "id", "intrinsicHeight", "intrinsicWidth", "placeholderDataUrl", "updatedAt", "userId", "version" FROM "UserImage";
DROP TABLE "UserImage";
ALTER TABLE "new_UserImage" RENAME TO "UserImage";
CREATE UNIQUE INDEX "UserImage_userId_key" ON "UserImage"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
