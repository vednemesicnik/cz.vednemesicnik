-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_IssuePDF" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "issueId" TEXT NOT NULL,
    CONSTRAINT "IssuePDF_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_IssuePDF" ("contentType", "createdAt", "fileName", "id", "issueId", "updatedAt") SELECT "contentType", "createdAt", "fileName", "id", "issueId", "updatedAt" FROM "IssuePDF";
DROP TABLE "IssuePDF";
ALTER TABLE "new_IssuePDF" RENAME TO "IssuePDF";
CREATE UNIQUE INDEX "IssuePDF_fileName_key" ON "IssuePDF"("fileName");
CREATE UNIQUE INDEX "IssuePDF_issueId_key" ON "IssuePDF"("issueId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

