-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "roleId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "UserRole" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "User_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "altText" TEXT,
    "contentType" TEXT NOT NULL,
    "blob" BLOB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "UserImage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Password" (
    "hash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Password_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserPermission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "access" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expirationDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Passkey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "credentialId" TEXT NOT NULL,
    "credentialPublicKey" BLOB NOT NULL,
    "credentialCounter" BIGINT NOT NULL,
    "credentialTransports" TEXT NOT NULL,
    "credentialDeviceType" TEXT NOT NULL,
    "credentialBackedUp" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Passkey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Connection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerName" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Connection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL,
    "digits" INTEGER NOT NULL,
    "period" INTEGER NOT NULL,
    "charSet" TEXT NOT NULL,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Author" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "bio" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "roleId" TEXT NOT NULL,
    CONSTRAINT "Author_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "AuthorRole" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuthorRole" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AuthorPermission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "access" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ArchivedIssue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "releasedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "ArchivedIssue_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ArchivedIssueCover" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "altText" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "blob" BLOB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "issueId" TEXT NOT NULL,
    CONSTRAINT "ArchivedIssueCover_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "ArchivedIssue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ArchivedIssuePDF" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "blob" BLOB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "issueId" TEXT NOT NULL,
    CONSTRAINT "ArchivedIssuePDF_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "ArchivedIssue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Podcast" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "Podcast_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PodcastCover" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "altText" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "blob" BLOB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "podcastId" TEXT NOT NULL,
    CONSTRAINT "PodcastCover_podcastId_fkey" FOREIGN KEY ("podcastId") REFERENCES "Podcast" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PodcastEpisode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "podcastId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "PodcastEpisode_podcastId_fkey" FOREIGN KEY ("podcastId") REFERENCES "Podcast" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PodcastEpisode_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PodcastEpisodeLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "episodeId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "PodcastEpisodeLink_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "PodcastEpisode" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PodcastEpisodeLink_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PodcastEpisodeCover" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "altText" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "blob" BLOB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "episodeId" TEXT NOT NULL,
    CONSTRAINT "PodcastEpisodeCover_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "PodcastEpisode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EditorialBoardPosition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "pluralLabel" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "EditorialBoardPosition_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EditorialBoardMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "EditorialBoardMember_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_UserPermissionToUserRole" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_UserPermissionToUserRole_A_fkey" FOREIGN KEY ("A") REFERENCES "UserPermission" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_UserPermissionToUserRole_B_fkey" FOREIGN KEY ("B") REFERENCES "UserRole" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_AuthorPermissionToAuthorRole" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_AuthorPermissionToAuthorRole_A_fkey" FOREIGN KEY ("A") REFERENCES "AuthorPermission" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_AuthorPermissionToAuthorRole_B_fkey" FOREIGN KEY ("B") REFERENCES "AuthorRole" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_EditorialBoardMemberToEditorialBoardPosition" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_EditorialBoardMemberToEditorialBoardPosition_A_fkey" FOREIGN KEY ("A") REFERENCES "EditorialBoardMember" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_EditorialBoardMemberToEditorialBoardPosition_B_fkey" FOREIGN KEY ("B") REFERENCES "EditorialBoardPosition" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_authorId_key" ON "User"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "UserImage_userId_key" ON "UserImage"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Password_userId_key" ON "Password"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_name_key" ON "UserRole"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserPermission_action_entity_access_key" ON "UserPermission"("action", "entity", "access");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Passkey_credentialId_key" ON "Passkey"("credentialId");

-- CreateIndex
CREATE INDEX "Passkey_userId_idx" ON "Passkey"("userId");

-- CreateIndex
CREATE INDEX "Connection_userId_idx" ON "Connection"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Connection_providerName_providerId_key" ON "Connection"("providerName", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "Verification_target_type_key" ON "Verification"("target", "type");

-- CreateIndex
CREATE UNIQUE INDEX "AuthorRole_name_key" ON "AuthorRole"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AuthorPermission_action_entity_access_key" ON "AuthorPermission"("action", "entity", "access");

-- CreateIndex
CREATE INDEX "ArchivedIssue_authorId_idx" ON "ArchivedIssue"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "ArchivedIssueCover_issueId_key" ON "ArchivedIssueCover"("issueId");

-- CreateIndex
CREATE UNIQUE INDEX "ArchivedIssuePDF_fileName_key" ON "ArchivedIssuePDF"("fileName");

-- CreateIndex
CREATE UNIQUE INDEX "ArchivedIssuePDF_issueId_key" ON "ArchivedIssuePDF"("issueId");

-- CreateIndex
CREATE UNIQUE INDEX "Podcast_slug_key" ON "Podcast"("slug");

-- CreateIndex
CREATE INDEX "Podcast_authorId_idx" ON "Podcast"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "PodcastCover_podcastId_key" ON "PodcastCover"("podcastId");

-- CreateIndex
CREATE UNIQUE INDEX "PodcastEpisode_slug_key" ON "PodcastEpisode"("slug");

-- CreateIndex
CREATE INDEX "PodcastEpisode_podcastId_idx" ON "PodcastEpisode"("podcastId");

-- CreateIndex
CREATE INDEX "PodcastEpisode_authorId_idx" ON "PodcastEpisode"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "PodcastEpisode_podcastId_number_key" ON "PodcastEpisode"("podcastId", "number");

-- CreateIndex
CREATE INDEX "PodcastEpisodeLink_episodeId_idx" ON "PodcastEpisodeLink"("episodeId");

-- CreateIndex
CREATE INDEX "PodcastEpisodeLink_authorId_idx" ON "PodcastEpisodeLink"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "PodcastEpisodeCover_episodeId_key" ON "PodcastEpisodeCover"("episodeId");

-- CreateIndex
CREATE UNIQUE INDEX "EditorialBoardPosition_key_key" ON "EditorialBoardPosition"("key");

-- CreateIndex
CREATE UNIQUE INDEX "EditorialBoardPosition_order_key" ON "EditorialBoardPosition"("order");

-- CreateIndex
CREATE INDEX "EditorialBoardPosition_authorId_idx" ON "EditorialBoardPosition"("authorId");

-- CreateIndex
CREATE INDEX "EditorialBoardMember_authorId_idx" ON "EditorialBoardMember"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "_UserPermissionToUserRole_AB_unique" ON "_UserPermissionToUserRole"("A", "B");

-- CreateIndex
CREATE INDEX "_UserPermissionToUserRole_B_index" ON "_UserPermissionToUserRole"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_AuthorPermissionToAuthorRole_AB_unique" ON "_AuthorPermissionToAuthorRole"("A", "B");

-- CreateIndex
CREATE INDEX "_AuthorPermissionToAuthorRole_B_index" ON "_AuthorPermissionToAuthorRole"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_EditorialBoardMemberToEditorialBoardPosition_AB_unique" ON "_EditorialBoardMemberToEditorialBoardPosition"("A", "B");

-- CreateIndex
CREATE INDEX "_EditorialBoardMemberToEditorialBoardPosition_B_index" ON "_EditorialBoardMemberToEditorialBoardPosition"("B");

-- Manally insert the initial data
PRAGMA foreign_keys=OFF;
INSERT INTO User VALUES('cm3vmvgk0003kqfe39m0jpjgf','spolek@vednemesicnik.cz','spolek@vednemesicnik.cz','Vedneměsíčník, z. s.',1732454827920,1732454827920,'cm3vmvgh5003eqfe32w4eci8e','cm3vmvghp003jqfe3htku58z4');
INSERT INTO Password VALUES('$2a$10$O6ss/Qr0UMVREdmkAPxYteXrYysi1TQIO4jT.LWAIJQ.0ujW/06cK','cm3vmvgk0003kqfe39m0jpjgf');
INSERT INTO UserRole VALUES('cm3vmvggy003cqfe3uauhgs1z','user','',1732454827810,1732454827810);
INSERT INTO UserRole VALUES('cm3vmvgh1003dqfe3dbrzuwwq','administrator','',1732454827814,1732454827814);
INSERT INTO UserRole VALUES('cm3vmvgh5003eqfe32w4eci8e','owner','',1732454827817,1732454827817);
INSERT INTO UserPermission VALUES('cm3vmvgdy0000qfe3i073lt36','view','user','own','',1732454827703,1732454827703);
INSERT INTO UserPermission VALUES('cm3vmvge00001qfe3np8brnth','view','user','any','',1732454827705,1732454827705);
INSERT INTO UserPermission VALUES('cm3vmvge10002qfe34jncpfe6','create','user','own','',1732454827706,1732454827706);
INSERT INTO UserPermission VALUES('cm3vmvge20003qfe3xfca5uw2','create','user','any','',1732454827707,1732454827707);
INSERT INTO UserPermission VALUES('cm3vmvge30004qfe3t5p16lq0','update','user','own','',1732454827707,1732454827707);
INSERT INTO UserPermission VALUES('cm3vmvge30005qfe3fk70yfkg','update','user','any','',1732454827708,1732454827708);
INSERT INTO UserPermission VALUES('cm3vmvge40006qfe3tx5ww3bi','delete','user','own','',1732454827708,1732454827708);
INSERT INTO UserPermission VALUES('cm3vmvge40007qfe3lbc1hjrl','delete','user','any','',1732454827709,1732454827709);
INSERT INTO UserPermission VALUES('cm3vmvge50008qfe3xqifc5nk','assign_role_owner','user','own','',1732454827710,1732454827710);
INSERT INTO UserPermission VALUES('cm3vmvge60009qfe3h9z87dpq','assign_role_owner','user','any','',1732454827710,1732454827710);
INSERT INTO UserPermission VALUES('cm3vmvge6000aqfe3xit0ya3s','assign_role_administrator','user','own','',1732454827711,1732454827711);
INSERT INTO UserPermission VALUES('cm3vmvge7000bqfe3yna5nh5p','assign_role_administrator','user','any','',1732454827711,1732454827711);
INSERT INTO UserPermission VALUES('cm3vmvge8000cqfe3fu9f1e18','assign_role_user','user','own','',1732454827712,1732454827712);
INSERT INTO UserPermission VALUES('cm3vmvge8000dqfe3h0zai606','assign_role_user','user','any','',1732454827713,1732454827713);
INSERT INTO UserPermission VALUES('cm3vmvge9000eqfe3cu1cqpy2','assign_role_editor','user','own','',1732454827713,1732454827713);
INSERT INTO UserPermission VALUES('cm3vmvge9000fqfe3aq355g84','assign_role_editor','user','any','',1732454827714,1732454827714);
INSERT INTO UserPermission VALUES('cm3vmvgea000gqfe34188yli2','assign_role_author','user','own','',1732454827714,1732454827714);
INSERT INTO UserPermission VALUES('cm3vmvgea000hqfe3osfx7uxh','assign_role_author','user','any','',1732454827715,1732454827715);
INSERT INTO UserPermission VALUES('cm3vmvgeb000iqfe3i54oha5v','assign_role_contributor','user','own','',1732454827715,1732454827715);
INSERT INTO UserPermission VALUES('cm3vmvgec000jqfe3nyp7geko','assign_role_contributor','user','any','',1732454827716,1732454827716);
INSERT INTO UserPermission VALUES('cm3vmvged000kqfe34bilnd6d','view','author','own','',1732454827718,1732454827718);
INSERT INTO UserPermission VALUES('cm3vmvgee000lqfe3flzxf063','view','author','any','',1732454827719,1732454827719);
INSERT INTO UserPermission VALUES('cm3vmvgeg000mqfe3u8t8cuzm','create','author','own','',1732454827721,1732454827721);
INSERT INTO UserPermission VALUES('cm3vmvgei000nqfe33kq6i7nj','create','author','any','',1732454827722,1732454827722);
INSERT INTO UserPermission VALUES('cm3vmvgej000oqfe3k88tknqb','update','author','own','',1732454827723,1732454827723);
INSERT INTO UserPermission VALUES('cm3vmvgek000pqfe3ta9q6h0r','update','author','any','',1732454827724,1732454827724);
INSERT INTO UserPermission VALUES('cm3vmvgel000qqfe3qacnkxsn','delete','author','own','',1732454827725,1732454827725);
INSERT INTO UserPermission VALUES('cm3vmvgel000rqfe3oy0rhxgw','delete','author','any','',1732454827726,1732454827726);
INSERT INTO UserPermission VALUES('cm3vmvgem000sqfe3aspfvxg9','assign_role_owner','author','own','',1732454827727,1732454827727);
INSERT INTO UserPermission VALUES('cm3vmvgen000tqfe3psktxkyl','assign_role_owner','author','any','',1732454827728,1732454827728);
INSERT INTO UserPermission VALUES('cm3vmvgeo000uqfe3jdthyq09','assign_role_administrator','author','own','',1732454827729,1732454827729);
INSERT INTO UserPermission VALUES('cm3vmvgep000vqfe3dygo1x5z','assign_role_administrator','author','any','',1732454827729,1732454827729);
INSERT INTO UserPermission VALUES('cm3vmvgeq000wqfe3vphqp884','assign_role_user','author','own','',1732454827730,1732454827730);
INSERT INTO UserPermission VALUES('cm3vmvgeq000xqfe32wftz0be','assign_role_user','author','any','',1732454827731,1732454827731);
INSERT INTO UserPermission VALUES('cm3vmvger000yqfe32ycybbiy','assign_role_editor','author','own','',1732454827731,1732454827731);
INSERT INTO UserPermission VALUES('cm3vmvges000zqfe3bjyn656r','assign_role_editor','author','any','',1732454827732,1732454827732);
INSERT INTO UserPermission VALUES('cm3vmvges0010qfe39hx06y8h','assign_role_author','author','own','',1732454827733,1732454827733);
INSERT INTO UserPermission VALUES('cm3vmvget0011qfe39jaga2dq','assign_role_author','author','any','',1732454827734,1732454827734);
INSERT INTO UserPermission VALUES('cm3vmvgeu0012qfe39fncv9e1','assign_role_contributor','author','own','',1732454827734,1732454827734);
INSERT INTO UserPermission VALUES('cm3vmvgev0013qfe3bfe58blx','assign_role_contributor','author','any','',1732454827736,1732454827736);
INSERT INTO Author VALUES('cm3vmvghp003jqfe3htku58z4','Vedneměsíčník, z. s.',NULL,1732454827838,1732454827838,'cm3vmvghh003hqfe3311frsxt');
INSERT INTO AuthorRole VALUES('cm3vmvgh8003fqfe3usfeec2e','contributor','',1732454827821,1732454827821);
INSERT INTO AuthorRole VALUES('cm3vmvghc003gqfe3hg22mvr1','author','',1732454827824,1732454827824);
INSERT INTO AuthorRole VALUES('cm3vmvghh003hqfe3311frsxt','editor','',1732454827830,1732454827830);
INSERT INTO AuthorPermission VALUES('cm3vmvgew0014qfe34pl4w0ki','view','article','own','',1732454827736,1732454827736);
INSERT INTO AuthorPermission VALUES('cm3vmvgex0015qfe3qkadz260','view','article','any','',1732454827738,1732454827738);
INSERT INTO AuthorPermission VALUES('cm3vmvgez0016qfe3iym526xc','create','article','own','',1732454827739,1732454827739);
INSERT INTO AuthorPermission VALUES('cm3vmvgf10017qfe39bkrymqb','create','article','any','',1732454827742,1732454827742);
INSERT INTO AuthorPermission VALUES('cm3vmvgf20018qfe340yp6tih','update','article','own','',1732454827743,1732454827743);
INSERT INTO AuthorPermission VALUES('cm3vmvgf30019qfe3o2q7suib','update','article','any','',1732454827744,1732454827744);
INSERT INTO AuthorPermission VALUES('cm3vmvgf4001aqfe3onbpm69d','delete','article','own','',1732454827744,1732454827744);
INSERT INTO AuthorPermission VALUES('cm3vmvgf5001bqfe34w48tudq','delete','article','any','',1732454827746,1732454827746);
INSERT INTO AuthorPermission VALUES('cm3vmvgf6001cqfe3fn2zxt47','publish','article','own','',1732454827747,1732454827747);
INSERT INTO AuthorPermission VALUES('cm3vmvgf7001dqfe30ygncswc','publish','article','any','',1732454827748,1732454827748);
INSERT INTO AuthorPermission VALUES('cm3vmvgf8001eqfe3bg7o78bz','view','article_category','own','',1732454827749,1732454827749);
INSERT INTO AuthorPermission VALUES('cm3vmvgfa001fqfe3j3y7gax9','view','article_category','any','',1732454827751,1732454827751);
INSERT INTO AuthorPermission VALUES('cm3vmvgfb001gqfe382u0rp2j','create','article_category','own','',1732454827752,1732454827752);
INSERT INTO AuthorPermission VALUES('cm3vmvgfc001hqfe32l9yamww','create','article_category','any','',1732454827752,1732454827752);
INSERT INTO AuthorPermission VALUES('cm3vmvgfd001iqfe3p1yvqdam','update','article_category','own','',1732454827753,1732454827753);
INSERT INTO AuthorPermission VALUES('cm3vmvgfe001jqfe3fo3io5bn','update','article_category','any','',1732454827754,1732454827754);
INSERT INTO AuthorPermission VALUES('cm3vmvgfe001kqfe3jw4lqoij','delete','article_category','own','',1732454827755,1732454827755);
INSERT INTO AuthorPermission VALUES('cm3vmvgff001lqfe3ms8d63jk','delete','article_category','any','',1732454827756,1732454827756);
INSERT INTO AuthorPermission VALUES('cm3vmvgfg001mqfe3t6itfjn3','publish','article_category','own','',1732454827756,1732454827756);
INSERT INTO AuthorPermission VALUES('cm3vmvgfh001nqfe3ln86ai7t','publish','article_category','any','',1732454827757,1732454827757);
INSERT INTO AuthorPermission VALUES('cm3vmvgfi001oqfe3k3ki51px','view','podcast','own','',1732454827758,1732454827758);
INSERT INTO AuthorPermission VALUES('cm3vmvgfi001pqfe3drfvvur9','view','podcast','any','',1732454827759,1732454827759);
INSERT INTO AuthorPermission VALUES('cm3vmvgfj001qqfe3z8lpxsx8','create','podcast','own','',1732454827759,1732454827759);
INSERT INTO AuthorPermission VALUES('cm3vmvgfk001rqfe39tg2vg19','create','podcast','any','',1732454827760,1732454827760);
INSERT INTO AuthorPermission VALUES('cm3vmvgfk001sqfe3mnn1q4ca','update','podcast','own','',1732454827761,1732454827761);
INSERT INTO AuthorPermission VALUES('cm3vmvgfl001tqfe30x6nogyq','update','podcast','any','',1732454827761,1732454827761);
INSERT INTO AuthorPermission VALUES('cm3vmvgfl001uqfe3ihvz99wy','delete','podcast','own','',1732454827762,1732454827762);
INSERT INTO AuthorPermission VALUES('cm3vmvgfm001vqfe3wa4p9u53','delete','podcast','any','',1732454827762,1732454827762);
INSERT INTO AuthorPermission VALUES('cm3vmvgfn001wqfe3a8qny5sq','publish','podcast','own','',1732454827763,1732454827763);
INSERT INTO AuthorPermission VALUES('cm3vmvgfn001xqfe3vzmukr53','publish','podcast','any','',1732454827764,1732454827764);
INSERT INTO AuthorPermission VALUES('cm3vmvgfo001yqfe3fvj4wdw8','view','podcast_episode','own','',1732454827764,1732454827764);
INSERT INTO AuthorPermission VALUES('cm3vmvgfo001zqfe3e7ef5qbd','view','podcast_episode','any','',1732454827765,1732454827765);
INSERT INTO AuthorPermission VALUES('cm3vmvgfp0020qfe3rg9o3i3g','create','podcast_episode','own','',1732454827766,1732454827766);
INSERT INTO AuthorPermission VALUES('cm3vmvgfq0021qfe3tjwur0n5','create','podcast_episode','any','',1732454827766,1732454827766);
INSERT INTO AuthorPermission VALUES('cm3vmvgfq0022qfe3z0nvb0pa','update','podcast_episode','own','',1732454827767,1732454827767);
INSERT INTO AuthorPermission VALUES('cm3vmvgfr0023qfe3frs6xk3o','update','podcast_episode','any','',1732454827767,1732454827767);
INSERT INTO AuthorPermission VALUES('cm3vmvgfs0024qfe3mwc89b6d','delete','podcast_episode','own','',1732454827768,1732454827768);
INSERT INTO AuthorPermission VALUES('cm3vmvgft0025qfe387oc5xww','delete','podcast_episode','any','',1732454827770,1732454827770);
INSERT INTO AuthorPermission VALUES('cm3vmvgfv0026qfe3n9ulqdx9','publish','podcast_episode','own','',1732454827772,1732454827772);
INSERT INTO AuthorPermission VALUES('cm3vmvgfx0027qfe3csyfsa8e','publish','podcast_episode','any','',1732454827774,1732454827774);
INSERT INTO AuthorPermission VALUES('cm3vmvgfy0028qfe3ftrklmi9','view','podcast_episode_link','own','',1732454827775,1732454827775);
INSERT INTO AuthorPermission VALUES('cm3vmvgfz0029qfe3wf88pv59','view','podcast_episode_link','any','',1732454827776,1732454827776);
INSERT INTO AuthorPermission VALUES('cm3vmvgg0002aqfe3lnwovbjz','create','podcast_episode_link','own','',1732454827777,1732454827777);
INSERT INTO AuthorPermission VALUES('cm3vmvgg1002bqfe3tg1eogob','create','podcast_episode_link','any','',1732454827777,1732454827777);
INSERT INTO AuthorPermission VALUES('cm3vmvgg1002cqfe3skci91cm','update','podcast_episode_link','own','',1732454827778,1732454827778);
INSERT INTO AuthorPermission VALUES('cm3vmvgg2002dqfe3l00ixkti','update','podcast_episode_link','any','',1732454827779,1732454827779);
INSERT INTO AuthorPermission VALUES('cm3vmvgg3002eqfe317oh0ndm','delete','podcast_episode_link','own','',1732454827780,1732454827780);
INSERT INTO AuthorPermission VALUES('cm3vmvgg4002fqfe3o2tpond1','delete','podcast_episode_link','any','',1732454827781,1732454827781);
INSERT INTO AuthorPermission VALUES('cm3vmvgg5002gqfe3lzm98zm8','publish','podcast_episode_link','own','',1732454827781,1732454827781);
INSERT INTO AuthorPermission VALUES('cm3vmvgg6002hqfe3x4j4tmr6','publish','podcast_episode_link','any','',1732454827782,1732454827782);
INSERT INTO AuthorPermission VALUES('cm3vmvgg6002iqfe3mo45njku','view','archived_issue','own','',1732454827783,1732454827783);
INSERT INTO AuthorPermission VALUES('cm3vmvgg7002jqfe3e9a40udy','view','archived_issue','any','',1732454827783,1732454827783);
INSERT INTO AuthorPermission VALUES('cm3vmvgg7002kqfe3coe8qtez','create','archived_issue','own','',1732454827784,1732454827784);
INSERT INTO AuthorPermission VALUES('cm3vmvgg8002lqfe36le1q3ww','create','archived_issue','any','',1732454827784,1732454827784);
INSERT INTO AuthorPermission VALUES('cm3vmvgg8002mqfe3rtjdjyui','update','archived_issue','own','',1732454827785,1732454827785);
INSERT INTO AuthorPermission VALUES('cm3vmvgg9002nqfe3dt58e1e3','update','archived_issue','any','',1732454827785,1732454827785);
INSERT INTO AuthorPermission VALUES('cm3vmvgg9002oqfe3spaivydx','delete','archived_issue','own','',1732454827786,1732454827786);
INSERT INTO AuthorPermission VALUES('cm3vmvgga002pqfe3lilaf0m1','delete','archived_issue','any','',1732454827787,1732454827787);
INSERT INTO AuthorPermission VALUES('cm3vmvggb002qqfe3zhfy2cyb','publish','archived_issue','own','',1732454827787,1732454827787);
INSERT INTO AuthorPermission VALUES('cm3vmvggc002rqfe3gf3ypxxz','publish','archived_issue','any','',1732454827789,1732454827789);
INSERT INTO AuthorPermission VALUES('cm3vmvggd002sqfe3a1h1q909','view','editorial_board_position','own','',1732454827790,1732454827790);
INSERT INTO AuthorPermission VALUES('cm3vmvggf002tqfe3qxcooir0','view','editorial_board_position','any','',1732454827791,1732454827791);
INSERT INTO AuthorPermission VALUES('cm3vmvggf002uqfe36xyndu2h','create','editorial_board_position','own','',1732454827792,1732454827792);
INSERT INTO AuthorPermission VALUES('cm3vmvggh002vqfe37gyakwjh','create','editorial_board_position','any','',1732454827793,1732454827793);
INSERT INTO AuthorPermission VALUES('cm3vmvggi002wqfe3v6zat3mx','update','editorial_board_position','own','',1732454827794,1732454827794);
INSERT INTO AuthorPermission VALUES('cm3vmvggj002xqfe3xiic8qgd','update','editorial_board_position','any','',1732454827795,1732454827795);
INSERT INTO AuthorPermission VALUES('cm3vmvggk002yqfe35stryv7y','delete','editorial_board_position','own','',1732454827796,1732454827796);
INSERT INTO AuthorPermission VALUES('cm3vmvggm002zqfe30li6ouiu','delete','editorial_board_position','any','',1732454827798,1732454827798);
INSERT INTO AuthorPermission VALUES('cm3vmvggn0030qfe3v14kklje','publish','editorial_board_position','own','',1732454827799,1732454827799);
INSERT INTO AuthorPermission VALUES('cm3vmvggn0031qfe3kd81q2g7','publish','editorial_board_position','any','',1732454827800,1732454827800);
INSERT INTO AuthorPermission VALUES('cm3vmvggo0032qfe37u3aeloc','view','editorial_board_member','own','',1732454827800,1732454827800);
INSERT INTO AuthorPermission VALUES('cm3vmvggp0033qfe3nzo3a7dk','view','editorial_board_member','any','',1732454827801,1732454827801);
INSERT INTO AuthorPermission VALUES('cm3vmvggp0034qfe3txntija5','create','editorial_board_member','own','',1732454827802,1732454827802);
INSERT INTO AuthorPermission VALUES('cm3vmvggq0035qfe3lwlht9g0','create','editorial_board_member','any','',1732454827803,1732454827803);
INSERT INTO AuthorPermission VALUES('cm3vmvggr0036qfe3l1zshohz','update','editorial_board_member','own','',1732454827803,1732454827803);
INSERT INTO AuthorPermission VALUES('cm3vmvggr0037qfe3c32glzfk','update','editorial_board_member','any','',1732454827804,1732454827804);
INSERT INTO AuthorPermission VALUES('cm3vmvggs0038qfe34fit0ud1','delete','editorial_board_member','own','',1732454827805,1732454827805);
INSERT INTO AuthorPermission VALUES('cm3vmvggt0039qfe3cwrednhs','delete','editorial_board_member','any','',1732454827805,1732454827805);
INSERT INTO AuthorPermission VALUES('cm3vmvggu003aqfe38tda60uh','publish','editorial_board_member','own','',1732454827806,1732454827806);
INSERT INTO AuthorPermission VALUES('cm3vmvggu003bqfe3cy2fyxoc','publish','editorial_board_member','any','',1732454827807,1732454827807);
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvge30004qfe3t5p16lq0','cm3vmvggy003cqfe3uauhgs1z');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvgdy0000qfe3i073lt36','cm3vmvggy003cqfe3uauhgs1z');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvgej000oqfe3k88tknqb','cm3vmvggy003cqfe3uauhgs1z');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvged000kqfe34bilnd6d','cm3vmvggy003cqfe3uauhgs1z');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvge6000aqfe3xit0ya3s','cm3vmvgh1003dqfe3dbrzuwwq');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvge8000cqfe3fu9f1e18','cm3vmvgh1003dqfe3dbrzuwwq');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvge10002qfe34jncpfe6','cm3vmvgh1003dqfe3dbrzuwwq');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvge40006qfe3tx5ww3bi','cm3vmvgh1003dqfe3dbrzuwwq');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvge30004qfe3t5p16lq0','cm3vmvgh1003dqfe3dbrzuwwq');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvgdy0000qfe3i073lt36','cm3vmvgh1003dqfe3dbrzuwwq');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvge7000bqfe3yna5nh5p','cm3vmvgh1003dqfe3dbrzuwwq');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvge9000fqfe3aq355g84','cm3vmvgh1003dqfe3dbrzuwwq');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvge20003qfe3xfca5uw2','cm3vmvgh1003dqfe3dbrzuwwq');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvge40007qfe3lbc1hjrl','cm3vmvgh1003dqfe3dbrzuwwq');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvge30005qfe3fk70yfkg','cm3vmvgh1003dqfe3dbrzuwwq');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvge00001qfe3np8brnth','cm3vmvgh1003dqfe3dbrzuwwq');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvges0010qfe39hx06y8h','cm3vmvgh1003dqfe3dbrzuwwq');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvgeu0012qfe39fncv9e1','cm3vmvgh1003dqfe3dbrzuwwq');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvger000yqfe32ycybbiy','cm3vmvgh1003dqfe3dbrzuwwq');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvgeg000mqfe3u8t8cuzm','cm3vmvgh1003dqfe3dbrzuwwq');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvgel000qqfe3qacnkxsn','cm3vmvgh1003dqfe3dbrzuwwq');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvgej000oqfe3k88tknqb','cm3vmvgh1003dqfe3dbrzuwwq');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvged000kqfe34bilnd6d','cm3vmvgh1003dqfe3dbrzuwwq');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvget0011qfe39jaga2dq','cm3vmvgh1003dqfe3dbrzuwwq');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvgev0013qfe3bfe58blx','cm3vmvgh1003dqfe3dbrzuwwq');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvges000zqfe3bjyn656r','cm3vmvgh1003dqfe3dbrzuwwq');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvgei000nqfe33kq6i7nj','cm3vmvgh1003dqfe3dbrzuwwq');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvgel000rqfe3oy0rhxgw','cm3vmvgh1003dqfe3dbrzuwwq');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvgek000pqfe3ta9q6h0r','cm3vmvgh1003dqfe3dbrzuwwq');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvgee000lqfe3flzxf063','cm3vmvgh1003dqfe3dbrzuwwq');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvge6000aqfe3xit0ya3s','cm3vmvgh5003eqfe32w4eci8e');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvge9000eqfe3cu1cqpy2','cm3vmvgh5003eqfe32w4eci8e');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvge50008qfe3xqifc5nk','cm3vmvgh5003eqfe32w4eci8e');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvge10002qfe34jncpfe6','cm3vmvgh5003eqfe32w4eci8e');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvge40006qfe3tx5ww3bi','cm3vmvgh5003eqfe32w4eci8e');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvge30004qfe3t5p16lq0','cm3vmvgh5003eqfe32w4eci8e');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvgdy0000qfe3i073lt36','cm3vmvgh5003eqfe32w4eci8e');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvge7000bqfe3yna5nh5p','cm3vmvgh5003eqfe32w4eci8e');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvge9000fqfe3aq355g84','cm3vmvgh5003eqfe32w4eci8e');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvge60009qfe3h9z87dpq','cm3vmvgh5003eqfe32w4eci8e');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvge20003qfe3xfca5uw2','cm3vmvgh5003eqfe32w4eci8e');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvge40007qfe3lbc1hjrl','cm3vmvgh5003eqfe32w4eci8e');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvge30005qfe3fk70yfkg','cm3vmvgh5003eqfe32w4eci8e');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvge00001qfe3np8brnth','cm3vmvgh5003eqfe32w4eci8e');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvges0010qfe39hx06y8h','cm3vmvgh5003eqfe32w4eci8e');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvgeu0012qfe39fncv9e1','cm3vmvgh5003eqfe32w4eci8e');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvger000yqfe32ycybbiy','cm3vmvgh5003eqfe32w4eci8e');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvgeg000mqfe3u8t8cuzm','cm3vmvgh5003eqfe32w4eci8e');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvgel000qqfe3qacnkxsn','cm3vmvgh5003eqfe32w4eci8e');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvgej000oqfe3k88tknqb','cm3vmvgh5003eqfe32w4eci8e');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvged000kqfe34bilnd6d','cm3vmvgh5003eqfe32w4eci8e');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvget0011qfe39jaga2dq','cm3vmvgh5003eqfe32w4eci8e');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvgev0013qfe3bfe58blx','cm3vmvgh5003eqfe32w4eci8e');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvges000zqfe3bjyn656r','cm3vmvgh5003eqfe32w4eci8e');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvgei000nqfe33kq6i7nj','cm3vmvgh5003eqfe32w4eci8e');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvgel000rqfe3oy0rhxgw','cm3vmvgh5003eqfe32w4eci8e');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvgek000pqfe3ta9q6h0r','cm3vmvgh5003eqfe32w4eci8e');
INSERT INTO _UserPermissionToUserRole VALUES('cm3vmvgee000lqfe3flzxf063','cm3vmvgh5003eqfe32w4eci8e');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgez0016qfe3iym526xc','cm3vmvgh8003fqfe3usfeec2e');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgf4001aqfe3onbpm69d','cm3vmvgh8003fqfe3usfeec2e');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgf20018qfe340yp6tih','cm3vmvgh8003fqfe3usfeec2e');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgew0014qfe34pl4w0ki','cm3vmvgh8003fqfe3usfeec2e');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfj001qqfe3z8lpxsx8','cm3vmvgh8003fqfe3usfeec2e');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfl001uqfe3ihvz99wy','cm3vmvgh8003fqfe3usfeec2e');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfk001sqfe3mnn1q4ca','cm3vmvgh8003fqfe3usfeec2e');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfi001oqfe3k3ki51px','cm3vmvgh8003fqfe3usfeec2e');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfp0020qfe3rg9o3i3g','cm3vmvgh8003fqfe3usfeec2e');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfs0024qfe3mwc89b6d','cm3vmvgh8003fqfe3usfeec2e');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfq0022qfe3z0nvb0pa','cm3vmvgh8003fqfe3usfeec2e');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfo001yqfe3fvj4wdw8','cm3vmvgh8003fqfe3usfeec2e');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgg0002aqfe3lnwovbjz','cm3vmvgh8003fqfe3usfeec2e');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgg3002eqfe317oh0ndm','cm3vmvgh8003fqfe3usfeec2e');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgg1002cqfe3skci91cm','cm3vmvgh8003fqfe3usfeec2e');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfy0028qfe3ftrklmi9','cm3vmvgh8003fqfe3usfeec2e');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgez0016qfe3iym526xc','cm3vmvghc003gqfe3hg22mvr1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgf4001aqfe3onbpm69d','cm3vmvghc003gqfe3hg22mvr1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgf6001cqfe3fn2zxt47','cm3vmvghc003gqfe3hg22mvr1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgf20018qfe340yp6tih','cm3vmvghc003gqfe3hg22mvr1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgew0014qfe34pl4w0ki','cm3vmvghc003gqfe3hg22mvr1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfb001gqfe382u0rp2j','cm3vmvghc003gqfe3hg22mvr1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfe001kqfe3jw4lqoij','cm3vmvghc003gqfe3hg22mvr1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfg001mqfe3t6itfjn3','cm3vmvghc003gqfe3hg22mvr1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfd001iqfe3p1yvqdam','cm3vmvghc003gqfe3hg22mvr1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgf8001eqfe3bg7o78bz','cm3vmvghc003gqfe3hg22mvr1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfj001qqfe3z8lpxsx8','cm3vmvghc003gqfe3hg22mvr1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfl001uqfe3ihvz99wy','cm3vmvghc003gqfe3hg22mvr1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfn001wqfe3a8qny5sq','cm3vmvghc003gqfe3hg22mvr1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfk001sqfe3mnn1q4ca','cm3vmvghc003gqfe3hg22mvr1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfi001oqfe3k3ki51px','cm3vmvghc003gqfe3hg22mvr1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfp0020qfe3rg9o3i3g','cm3vmvghc003gqfe3hg22mvr1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfs0024qfe3mwc89b6d','cm3vmvghc003gqfe3hg22mvr1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfv0026qfe3n9ulqdx9','cm3vmvghc003gqfe3hg22mvr1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfq0022qfe3z0nvb0pa','cm3vmvghc003gqfe3hg22mvr1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfo001yqfe3fvj4wdw8','cm3vmvghc003gqfe3hg22mvr1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgg0002aqfe3lnwovbjz','cm3vmvghc003gqfe3hg22mvr1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgg3002eqfe317oh0ndm','cm3vmvghc003gqfe3hg22mvr1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgg5002gqfe3lzm98zm8','cm3vmvghc003gqfe3hg22mvr1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgg1002cqfe3skci91cm','cm3vmvghc003gqfe3hg22mvr1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfy0028qfe3ftrklmi9','cm3vmvghc003gqfe3hg22mvr1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgg7002kqfe3coe8qtez','cm3vmvghc003gqfe3hg22mvr1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgg9002oqfe3spaivydx','cm3vmvghc003gqfe3hg22mvr1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvggb002qqfe3zhfy2cyb','cm3vmvghc003gqfe3hg22mvr1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgg8002mqfe3rtjdjyui','cm3vmvghc003gqfe3hg22mvr1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgg6002iqfe3mo45njku','cm3vmvghc003gqfe3hg22mvr1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvggf002uqfe36xyndu2h','cm3vmvghc003gqfe3hg22mvr1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvggk002yqfe35stryv7y','cm3vmvghc003gqfe3hg22mvr1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvggn0030qfe3v14kklje','cm3vmvghc003gqfe3hg22mvr1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvggi002wqfe3v6zat3mx','cm3vmvghc003gqfe3hg22mvr1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvggd002sqfe3a1h1q909','cm3vmvghc003gqfe3hg22mvr1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvggp0034qfe3txntija5','cm3vmvghc003gqfe3hg22mvr1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvggs0038qfe34fit0ud1','cm3vmvghc003gqfe3hg22mvr1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvggu003aqfe38tda60uh','cm3vmvghc003gqfe3hg22mvr1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvggr0036qfe3l1zshohz','cm3vmvghc003gqfe3hg22mvr1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvggo0032qfe37u3aeloc','cm3vmvghc003gqfe3hg22mvr1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgez0016qfe3iym526xc','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgf4001aqfe3onbpm69d','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgf6001cqfe3fn2zxt47','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgf20018qfe340yp6tih','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgew0014qfe34pl4w0ki','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgf10017qfe39bkrymqb','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgf5001bqfe34w48tudq','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgf7001dqfe30ygncswc','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgf30019qfe3o2q7suib','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgex0015qfe3qkadz260','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfb001gqfe382u0rp2j','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfe001kqfe3jw4lqoij','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfg001mqfe3t6itfjn3','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfd001iqfe3p1yvqdam','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgf8001eqfe3bg7o78bz','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfc001hqfe32l9yamww','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgff001lqfe3ms8d63jk','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfh001nqfe3ln86ai7t','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfe001jqfe3fo3io5bn','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfa001fqfe3j3y7gax9','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfj001qqfe3z8lpxsx8','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfl001uqfe3ihvz99wy','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfn001wqfe3a8qny5sq','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfk001sqfe3mnn1q4ca','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfi001oqfe3k3ki51px','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfk001rqfe39tg2vg19','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfm001vqfe3wa4p9u53','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfn001xqfe3vzmukr53','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfl001tqfe30x6nogyq','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfi001pqfe3drfvvur9','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfp0020qfe3rg9o3i3g','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfs0024qfe3mwc89b6d','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfv0026qfe3n9ulqdx9','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfq0022qfe3z0nvb0pa','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfo001yqfe3fvj4wdw8','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfq0021qfe3tjwur0n5','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgft0025qfe387oc5xww','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfx0027qfe3csyfsa8e','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfr0023qfe3frs6xk3o','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfo001zqfe3e7ef5qbd','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgg0002aqfe3lnwovbjz','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgg3002eqfe317oh0ndm','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgg5002gqfe3lzm98zm8','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgg1002cqfe3skci91cm','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfy0028qfe3ftrklmi9','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgg1002bqfe3tg1eogob','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgg4002fqfe3o2tpond1','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgg6002hqfe3x4j4tmr6','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgg2002dqfe3l00ixkti','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgfz0029qfe3wf88pv59','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgg7002kqfe3coe8qtez','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgg9002oqfe3spaivydx','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvggb002qqfe3zhfy2cyb','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgg8002mqfe3rtjdjyui','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgg6002iqfe3mo45njku','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgg8002lqfe36le1q3ww','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgga002pqfe3lilaf0m1','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvggc002rqfe3gf3ypxxz','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgg9002nqfe3dt58e1e3','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvgg7002jqfe3e9a40udy','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvggf002uqfe36xyndu2h','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvggk002yqfe35stryv7y','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvggn0030qfe3v14kklje','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvggi002wqfe3v6zat3mx','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvggd002sqfe3a1h1q909','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvggh002vqfe37gyakwjh','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvggm002zqfe30li6ouiu','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvggn0031qfe3kd81q2g7','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvggj002xqfe3xiic8qgd','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvggf002tqfe3qxcooir0','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvggp0034qfe3txntija5','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvggs0038qfe34fit0ud1','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvggu003aqfe38tda60uh','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvggr0036qfe3l1zshohz','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvggo0032qfe37u3aeloc','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvggq0035qfe3lwlht9g0','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvggt0039qfe3cwrednhs','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvggu003bqfe3cy2fyxoc','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvggr0037qfe3c32glzfk','cm3vmvghh003hqfe3311frsxt');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm3vmvggp0033qfe3nzo3a7dk','cm3vmvghh003hqfe3311frsxt');
PRAGMA foreign_keys=ON;
