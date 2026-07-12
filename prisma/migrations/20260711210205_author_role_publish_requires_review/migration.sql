-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AuthorRole" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "publishRequiresReview" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_AuthorRole" ("createdAt", "description", "id", "level", "name", "updatedAt") SELECT "createdAt", "description", "id", "level", "name", "updatedAt" FROM "AuthorRole";
DROP TABLE "AuthorRole";
ALTER TABLE "new_AuthorRole" RENAME TO "AuthorRole";
CREATE UNIQUE INDEX "AuthorRole_name_key" ON "AuthorRole"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- Coordinators are exempt from the review-before-publish requirement.
UPDATE "AuthorRole" SET "publishRequiresReview" = false WHERE "name" = 'coordinator';
