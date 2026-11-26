-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Verification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "algorithm" TEXT,
    "digits" INTEGER,
    "period" INTEGER,
    "charSet" TEXT,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Verification" ("algorithm", "charSet", "createdAt", "digits", "expiresAt", "id", "period", "secret", "target", "type", "updatedAt") SELECT "algorithm", "charSet", "createdAt", "digits", "expiresAt", "id", "period", "secret", "target", "type", "updatedAt" FROM "Verification";
DROP TABLE "Verification";
ALTER TABLE "new_Verification" RENAME TO "Verification";
CREATE UNIQUE INDEX "Verification_target_type_key" ON "Verification"("target", "type");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
