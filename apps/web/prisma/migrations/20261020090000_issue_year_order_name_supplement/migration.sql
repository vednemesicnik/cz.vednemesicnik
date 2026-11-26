-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Issue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "name" TEXT,
    "supplement" TEXT,
    "supplementSlug" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "authorId" TEXT NOT NULL,
    "submittedAt" DATETIME,
    "submittedById" TEXT,
    CONSTRAINT "Issue_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Issue_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "Author" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
-- Backfill: the year of the release in Prague time (New Year is always CET, so +1 hour;
-- production stores some dates as epoch milliseconds, some as ISO text), the order from
-- the label "4/říjen 2026". No name, no supplement.
INSERT INTO "new_Issue" ("authorId", "createdAt", "id", "publishedAt", "state", "submittedAt", "submittedById", "updatedAt", "year", "order") SELECT "authorId", "createdAt", "id", "publishedAt", "state", "submittedAt", "submittedById", "updatedAt",
    CAST(CASE typeof("releasedAt") WHEN 'integer' THEN strftime('%Y', "releasedAt" / 1000, 'unixepoch', '+1 hour') ELSE strftime('%Y', "releasedAt", '+1 hour') END AS INTEGER),
    CAST(substr("label", 1, instr("label", '/') - 1) AS INTEGER)
FROM "Issue";
DROP TABLE "Issue";
ALTER TABLE "new_Issue" RENAME TO "Issue";
CREATE INDEX "Issue_authorId_idx" ON "Issue"("authorId");
CREATE INDEX "Issue_submittedById_idx" ON "Issue"("submittedById");
CREATE INDEX "Issue_state_authorId_idx" ON "Issue"("state", "authorId");
CREATE INDEX "Issue_state_year_order_idx" ON "Issue"("state", "year", "order");
CREATE UNIQUE INDEX "Issue_year_order_supplementSlug_key" ON "Issue"("year", "order", "supplementSlug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;


-- The cover's alt text follows the title, which has no month any more.
UPDATE "IssueCover" SET "altText" = 'Obálka čísla ' || (SELECT "Issue"."order" || '/' || "Issue"."year" FROM "Issue" WHERE "Issue"."id" = "IssueCover"."issueId");
