-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_IssuePDF" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileName" TEXT NOT NULL,
    "originalFileName" TEXT,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contentType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "issueId" TEXT NOT NULL,
    CONSTRAINT "IssuePDF_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
-- Backfill: a file uploaded before its name was kept has none. It was uploaded at its
-- newest logged upload (a replacement keeps the row), else when the row was created.
INSERT INTO "new_IssuePDF" ("contentType", "createdAt", "fileName", "id", "issueId", "updatedAt", "uploadedAt") SELECT "contentType", "createdAt", "fileName", "id", "issueId", "updatedAt",
    COALESCE(
        (SELECT "ContentLog"."createdAt" FROM "ContentLog"
            WHERE "ContentLog"."entity" = 'issue'
              AND "ContentLog"."entityId" = "IssuePDF"."issueId"
              AND "ContentLog"."event" = 'pdf_uploaded'
            ORDER BY "ContentLog"."createdAt" DESC LIMIT 1),
        "createdAt"
    )
FROM "IssuePDF";
DROP TABLE "IssuePDF";
ALTER TABLE "new_IssuePDF" RENAME TO "IssuePDF";
CREATE UNIQUE INDEX "IssuePDF_fileName_key" ON "IssuePDF"("fileName");
CREATE UNIQUE INDEX "IssuePDF_issueId_key" ON "IssuePDF"("issueId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
