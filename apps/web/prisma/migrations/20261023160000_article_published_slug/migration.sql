-- An article's address is unique only once published (log 0039): the typed slug is
-- no longer unique, and publish writes the held address to publishedSlug.

-- DropIndex
DROP INDEX "Article_slug_key";

-- AlterTable
ALTER TABLE "Article" ADD COLUMN "publishedSlug" TEXT;

-- Backfill: published and archived articles, and drafts that were published before
-- (retract keeps publishedAt), hold the address they have.
UPDATE "Article" SET "publishedSlug" = "slug"
WHERE "slug" IS NOT NULL AND ("state" <> 'draft' OR "publishedAt" IS NOT NULL);

-- A draft that was never published has no PageSEO row any more: publish writes it.
DELETE FROM "PageSEO"
WHERE "pathname" IN (
  SELECT '/articles/' || "slug" FROM "Article"
  WHERE "slug" IS NOT NULL AND "publishedSlug" IS NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Article_publishedSlug_key" ON "Article"("publishedSlug");

-- CreateIndex
CREATE INDEX "Article_slug_idx" ON "Article"("slug");
