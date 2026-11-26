-- AlterTable
ALTER TABLE "AuthLog" ADD COLUMN "emergencySignInLinkId" TEXT;

-- CreateTable
CREATE TABLE "EmergencySignInLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenHash" TEXT NOT NULL,
    "issuedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "replacedAt" DATETIME,
    "userId" TEXT NOT NULL,
    CONSTRAINT "EmergencySignInLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "EmergencySignInLink_tokenHash_key" ON "EmergencySignInLink"("tokenHash");

-- CreateIndex
CREATE INDEX "EmergencySignInLink_userId_idx" ON "EmergencySignInLink"("userId");

