-- An episode's address is unique within its podcast only once published (log 0039, design 27f):
-- the typed slug is no longer unique, and publish writes the held address to publishedSlug.

-- DropIndex
DROP INDEX "PodcastEpisode_slug_key";

-- AlterTable
ALTER TABLE "PodcastEpisode" ADD COLUMN "publishedSlug" TEXT;

-- Backfill: published and archived episodes, and drafts that were published before
-- (retract keeps publishedAt), hold the address they have.
UPDATE "PodcastEpisode" SET "publishedSlug" = "slug"
WHERE "state" <> 'draft' OR "publishedAt" IS NOT NULL;

-- CreateIndex
CREATE INDEX "PodcastEpisode_podcastId_slug_idx" ON "PodcastEpisode"("podcastId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "PodcastEpisode_podcastId_publishedSlug_key" ON "PodcastEpisode"("podcastId", "publishedSlug");
