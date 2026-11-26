-- CreateTable
CREATE TABLE "ContentLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "actorId" TEXT,
    "detail" TEXT,
    CONSTRAINT "ContentLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Author" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ContentLog_entity_entityId_createdAt_idx" ON "ContentLog"("entity", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "ContentLog_actorId_idx" ON "ContentLog"("actorId");

