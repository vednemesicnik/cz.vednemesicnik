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
    "level" INTEGER NOT NULL,
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
    "level" INTEGER NOT NULL,
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
    "state" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Issue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "releasedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "authorId" TEXT NOT NULL,
    CONSTRAINT "Issue_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IssueCover" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "altText" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "blob" BLOB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "issueId" TEXT NOT NULL,
    CONSTRAINT "IssueCover_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IssuePDF" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "blob" BLOB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "issueId" TEXT NOT NULL,
    CONSTRAINT "IssuePDF_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    "state" TEXT NOT NULL DEFAULT 'draft',
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
    "state" TEXT NOT NULL DEFAULT 'draft',
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
    "state" TEXT NOT NULL DEFAULT 'draft',
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
    "state" TEXT NOT NULL DEFAULT 'published',
    "authorId" TEXT NOT NULL,
    CONSTRAINT "EditorialBoardPosition_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EditorialBoardMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'published',
    "authorId" TEXT NOT NULL,
    CONSTRAINT "EditorialBoardMember_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "authorId" TEXT NOT NULL,
    CONSTRAINT "Article_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ArticleImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "altText" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "blob" BLOB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "articleId" TEXT NOT NULL,
    "featuredInArticleId" TEXT,
    CONSTRAINT "ArticleImage_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ArticleImage_featuredInArticleId_fkey" FOREIGN KEY ("featuredInArticleId") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ArticleTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "authorId" TEXT NOT NULL,
    CONSTRAINT "ArticleTag_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ArticleCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "authorId" TEXT NOT NULL,
    CONSTRAINT "ArticleCategory_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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

-- CreateTable
CREATE TABLE "_ArticleToArticleTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ArticleToArticleTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ArticleToArticleTag_B_fkey" FOREIGN KEY ("B") REFERENCES "ArticleTag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ArticleToArticleCategory" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ArticleToArticleCategory_A_fkey" FOREIGN KEY ("A") REFERENCES "Article" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ArticleToArticleCategory_B_fkey" FOREIGN KEY ("B") REFERENCES "ArticleCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
CREATE UNIQUE INDEX "AuthorPermission_action_entity_access_state_key" ON "AuthorPermission"("action", "entity", "access", "state");

-- CreateIndex
CREATE INDEX "Issue_authorId_idx" ON "Issue"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "IssueCover_issueId_key" ON "IssueCover"("issueId");

-- CreateIndex
CREATE UNIQUE INDEX "IssuePDF_fileName_key" ON "IssuePDF"("fileName");

-- CreateIndex
CREATE UNIQUE INDEX "IssuePDF_issueId_key" ON "IssuePDF"("issueId");

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
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "Article_authorId_idx" ON "Article"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleImage_featuredInArticleId_key" ON "ArticleImage"("featuredInArticleId");

-- CreateIndex
CREATE INDEX "ArticleImage_articleId_idx" ON "ArticleImage"("articleId");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleTag_name_key" ON "ArticleTag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleTag_slug_key" ON "ArticleTag"("slug");

-- CreateIndex
CREATE INDEX "ArticleTag_authorId_idx" ON "ArticleTag"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleCategory_name_key" ON "ArticleCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleCategory_slug_key" ON "ArticleCategory"("slug");

-- CreateIndex
CREATE INDEX "ArticleCategory_authorId_idx" ON "ArticleCategory"("authorId");

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

-- CreateIndex
CREATE UNIQUE INDEX "_ArticleToArticleTag_AB_unique" ON "_ArticleToArticleTag"("A", "B");

-- CreateIndex
CREATE INDEX "_ArticleToArticleTag_B_index" ON "_ArticleToArticleTag"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ArticleToArticleCategory_AB_unique" ON "_ArticleToArticleCategory"("A", "B");

-- CreateIndex
CREATE INDEX "_ArticleToArticleCategory_B_index" ON "_ArticleToArticleCategory"("B");

-- Manually insert the initial data
PRAGMA foreign_keys=OFF;
INSERT INTO UserRole VALUES('cm63hi8yk00cg704419kdzr4m','member',3,'',1737283107548,1737283107548);
INSERT INTO UserRole VALUES('cm63hi8yn00ch7044dno45ac2','administrator',2,'',1737283107551,1737283107551);
INSERT INTO UserRole VALUES('cm63hi8yo00ci7044y3inq2bh','owner',1,'',1737283107553,1737283107553);

INSERT INTO UserPermission VALUES('cm63hi8qb000070445ssq2eam','view','user','own','',1737283107252,1737283107252);
INSERT INTO UserPermission VALUES('cm63hi8qd000170440uleyfl7','create','user','own','',1737283107254,1737283107254);
INSERT INTO UserPermission VALUES('cm63hi8qe00027044xy2drowu','update','user','own','',1737283107254,1737283107254);
INSERT INTO UserPermission VALUES('cm63hi8qf00037044xne039df','delete','user','own','',1737283107255,1737283107255);
INSERT INTO UserPermission VALUES('cm63hi8qg00047044p1rz1h0a','view','user','any','',1737283107256,1737283107256);
INSERT INTO UserPermission VALUES('cm63hi8qh00057044dz6uj8d1','create','user','any','',1737283107257,1737283107257);
INSERT INTO UserPermission VALUES('cm63hi8qh000670449w9byz80','update','user','any','',1737283107258,1737283107258);
INSERT INTO UserPermission VALUES('cm63hi8qi00077044yds5gbha','delete','user','any','',1737283107258,1737283107258);
INSERT INTO UserPermission VALUES('cm63hi8qj00087044d1p1d9m1','view','author','own','',1737283107259,1737283107259);
INSERT INTO UserPermission VALUES('cm63hi8qj00097044d5tppzt8','create','author','own','',1737283107260,1737283107260);
INSERT INTO UserPermission VALUES('cm63hi8qk000a70444p1ssu51','update','author','own','',1737283107260,1737283107260);
INSERT INTO UserPermission VALUES('cm63hi8qk000b7044hrp15yc9','delete','author','own','',1737283107261,1737283107261);
INSERT INTO UserPermission VALUES('cm63hi8ql000c7044d110b1w2','view','author','any','',1737283107262,1737283107262);
INSERT INTO UserPermission VALUES('cm63hi8qm000d7044el9m4avy','create','author','any','',1737283107262,1737283107262);
INSERT INTO UserPermission VALUES('cm63hi8qn000e704468uwhx3g','update','author','any','',1737283107263,1737283107263);
INSERT INTO UserPermission VALUES('cm63hi8qo000f7044fmnilt0p','delete','author','any','',1737283107264,1737283107264);

INSERT INTO _UserPermissionToUserRole VALUES('cm63hi8qe00027044xy2drowu','cm63hi8yk00cg704419kdzr4m');
INSERT INTO _UserPermissionToUserRole VALUES('cm63hi8qb000070445ssq2eam','cm63hi8yk00cg704419kdzr4m');
INSERT INTO _UserPermissionToUserRole VALUES('cm63hi8qk000a70444p1ssu51','cm63hi8yk00cg704419kdzr4m');
INSERT INTO _UserPermissionToUserRole VALUES('cm63hi8qj00087044d1p1d9m1','cm63hi8yk00cg704419kdzr4m');
INSERT INTO _UserPermissionToUserRole VALUES('cm63hi8qh00057044dz6uj8d1','cm63hi8yn00ch7044dno45ac2');
INSERT INTO _UserPermissionToUserRole VALUES('cm63hi8qi00077044yds5gbha','cm63hi8yn00ch7044dno45ac2');
INSERT INTO _UserPermissionToUserRole VALUES('cm63hi8qh000670449w9byz80','cm63hi8yn00ch7044dno45ac2');
INSERT INTO _UserPermissionToUserRole VALUES('cm63hi8qg00047044p1rz1h0a','cm63hi8yn00ch7044dno45ac2');
INSERT INTO _UserPermissionToUserRole VALUES('cm63hi8qm000d7044el9m4avy','cm63hi8yn00ch7044dno45ac2');
INSERT INTO _UserPermissionToUserRole VALUES('cm63hi8qo000f7044fmnilt0p','cm63hi8yn00ch7044dno45ac2');
INSERT INTO _UserPermissionToUserRole VALUES('cm63hi8qn000e704468uwhx3g','cm63hi8yn00ch7044dno45ac2');
INSERT INTO _UserPermissionToUserRole VALUES('cm63hi8ql000c7044d110b1w2','cm63hi8yn00ch7044dno45ac2');
INSERT INTO _UserPermissionToUserRole VALUES('cm63hi8qh00057044dz6uj8d1','cm63hi8yo00ci7044y3inq2bh');
INSERT INTO _UserPermissionToUserRole VALUES('cm63hi8qi00077044yds5gbha','cm63hi8yo00ci7044y3inq2bh');
INSERT INTO _UserPermissionToUserRole VALUES('cm63hi8qh000670449w9byz80','cm63hi8yo00ci7044y3inq2bh');
INSERT INTO _UserPermissionToUserRole VALUES('cm63hi8qg00047044p1rz1h0a','cm63hi8yo00ci7044y3inq2bh');
INSERT INTO _UserPermissionToUserRole VALUES('cm63hi8qm000d7044el9m4avy','cm63hi8yo00ci7044y3inq2bh');
INSERT INTO _UserPermissionToUserRole VALUES('cm63hi8qo000f7044fmnilt0p','cm63hi8yo00ci7044y3inq2bh');
INSERT INTO _UserPermissionToUserRole VALUES('cm63hi8qn000e704468uwhx3g','cm63hi8yo00ci7044y3inq2bh');
INSERT INTO _UserPermissionToUserRole VALUES('cm63hi8ql000c7044d110b1w2','cm63hi8yo00ci7044y3inq2bh');

INSERT INTO AuthorRole VALUES('cm63hi8yr00cj7044fjngq6f4','contributor',3,'',1737283107555,1737283107555);
INSERT INTO AuthorRole VALUES('cm63hi8yx00ck7044zgniecm1','creator',2,'',1737283107562,1737283107562);
INSERT INTO AuthorRole VALUES('cm63hi8z800cl7044kr38q54w','coordinator',1,'',1737283107572,1737283107572);

INSERT INTO AuthorPermission VALUES('cm63hi8qq000g70447vzzg5e0','view','article','own','draft','',1737283107266,1737283107266);
INSERT INTO AuthorPermission VALUES('cm63hi8qr000h7044uacjbw56','create','article','own','draft','',1737283107268,1737283107268);
INSERT INTO AuthorPermission VALUES('cm63hi8qs000i7044yy0zao7h','update','article','own','draft','',1737283107269,1737283107269);
INSERT INTO AuthorPermission VALUES('cm63hi8qt000j7044l8vh0fv4','delete','article','own','draft','',1737283107270,1737283107270);
INSERT INTO AuthorPermission VALUES('cm63hi8qu000k70440ora43on','publish','article','own','draft','',1737283107270,1737283107270);
INSERT INTO AuthorPermission VALUES('cm63hi8qu000l7044cvglrcio','retract','article','own','draft','',1737283107271,1737283107271);
INSERT INTO AuthorPermission VALUES('cm63hi8qv000m7044zjwoigh9','archive','article','own','draft','',1737283107272,1737283107272);
INSERT INTO AuthorPermission VALUES('cm63hi8qw000n7044rzcz4e4p','restore','article','own','draft','',1737283107272,1737283107272);
INSERT INTO AuthorPermission VALUES('cm63hi8qx000o7044v78ugh6t','view','article','any','draft','',1737283107273,1737283107273);
INSERT INTO AuthorPermission VALUES('cm63hi8qx000p7044koxqteri','create','article','any','draft','',1737283107274,1737283107274);
INSERT INTO AuthorPermission VALUES('cm63hi8qy000q7044j6lsr3oj','update','article','any','draft','',1737283107275,1737283107275);
INSERT INTO AuthorPermission VALUES('cm63hi8qz000r7044tl4rryf7','delete','article','any','draft','',1737283107275,1737283107275);
INSERT INTO AuthorPermission VALUES('cm63hi8qz000s7044pjx85v6e','publish','article','any','draft','',1737283107276,1737283107276);
INSERT INTO AuthorPermission VALUES('cm63hi8r0000t7044pxl33xta','retract','article','any','draft','',1737283107277,1737283107277);
INSERT INTO AuthorPermission VALUES('cm63hi8r1000u7044k0mywg8t','archive','article','any','draft','',1737283107277,1737283107277);
INSERT INTO AuthorPermission VALUES('cm63hi8r1000v70448eelfn05','restore','article','any','draft','',1737283107278,1737283107278);
INSERT INTO AuthorPermission VALUES('cm63hi8r2000w7044cw8uv3qc','view','article','own','published','',1737283107278,1737283107278);
INSERT INTO AuthorPermission VALUES('cm63hi8r2000x7044pe3r19m2','create','article','own','published','',1737283107279,1737283107279);
INSERT INTO AuthorPermission VALUES('cm63hi8r3000y7044hjfoccn9','update','article','own','published','',1737283107279,1737283107279);
INSERT INTO AuthorPermission VALUES('cm63hi8r3000z704476jfold8','delete','article','own','published','',1737283107280,1737283107280);
INSERT INTO AuthorPermission VALUES('cm63hi8r400107044iozih42f','publish','article','own','published','',1737283107280,1737283107280);
INSERT INTO AuthorPermission VALUES('cm63hi8r400117044uzqwnlh6','retract','article','own','published','',1737283107281,1737283107281);
INSERT INTO AuthorPermission VALUES('cm63hi8r500127044gnetqeh3','archive','article','own','published','',1737283107282,1737283107282);
INSERT INTO AuthorPermission VALUES('cm63hi8r600137044uj3q2e86','restore','article','own','published','',1737283107282,1737283107282);
INSERT INTO AuthorPermission VALUES('cm63hi8r700147044hk11bsg6','view','article','any','published','',1737283107283,1737283107283);
INSERT INTO AuthorPermission VALUES('cm63hi8r7001570444ewtyb86','create','article','any','published','',1737283107284,1737283107284);
INSERT INTO AuthorPermission VALUES('cm63hi8r8001670448nz37d0k','update','article','any','published','',1737283107284,1737283107284);
INSERT INTO AuthorPermission VALUES('cm63hi8r8001770449jbu66tn','delete','article','any','published','',1737283107285,1737283107285);
INSERT INTO AuthorPermission VALUES('cm63hi8r900187044skuj3yt6','publish','article','any','published','',1737283107285,1737283107285);
INSERT INTO AuthorPermission VALUES('cm63hi8ra00197044thfknpym','retract','article','any','published','',1737283107286,1737283107286);
INSERT INTO AuthorPermission VALUES('cm63hi8ra001a7044hco292qc','archive','article','any','published','',1737283107287,1737283107287);
INSERT INTO AuthorPermission VALUES('cm63hi8rb001b7044hv8x7l79','restore','article','any','published','',1737283107287,1737283107287);
INSERT INTO AuthorPermission VALUES('cm63hi8rb001c7044x797pddx','view','article','own','archived','',1737283107288,1737283107288);
INSERT INTO AuthorPermission VALUES('cm63hi8rc001d7044evgsxkzs','create','article','own','archived','',1737283107289,1737283107289);
INSERT INTO AuthorPermission VALUES('cm63hi8rd001e7044zf1bozph','update','article','own','archived','',1737283107289,1737283107289);
INSERT INTO AuthorPermission VALUES('cm63hi8rd001f7044200hks8b','delete','article','own','archived','',1737283107290,1737283107290);
INSERT INTO AuthorPermission VALUES('cm63hi8re001g7044qaohw558','publish','article','own','archived','',1737283107290,1737283107290);
INSERT INTO AuthorPermission VALUES('cm63hi8re001h7044xlppghod','retract','article','own','archived','',1737283107291,1737283107291);
INSERT INTO AuthorPermission VALUES('cm63hi8rf001i7044hwn297lq','archive','article','own','archived','',1737283107292,1737283107292);
INSERT INTO AuthorPermission VALUES('cm63hi8rg001j7044vyv2jd9v','restore','article','own','archived','',1737283107292,1737283107292);
INSERT INTO AuthorPermission VALUES('cm63hi8rh001k7044n351dzrl','view','article','any','archived','',1737283107294,1737283107294);
INSERT INTO AuthorPermission VALUES('cm63hi8rj001l7044e6k86ict','create','article','any','archived','',1737283107296,1737283107296);
INSERT INTO AuthorPermission VALUES('cm63hi8rk001m7044p9xl9wdo','update','article','any','archived','',1737283107296,1737283107296);
INSERT INTO AuthorPermission VALUES('cm63hi8rl001n70444ktm1y9e','delete','article','any','archived','',1737283107297,1737283107297);
INSERT INTO AuthorPermission VALUES('cm63hi8rl001o7044wjim8vci','publish','article','any','archived','',1737283107298,1737283107298);
INSERT INTO AuthorPermission VALUES('cm63hi8rm001p7044wop88rj9','retract','article','any','archived','',1737283107298,1737283107298);
INSERT INTO AuthorPermission VALUES('cm63hi8rm001q7044mymsx1di','archive','article','any','archived','',1737283107299,1737283107299);
INSERT INTO AuthorPermission VALUES('cm63hi8rn001r7044a1gn7v4d','restore','article','any','archived','',1737283107300,1737283107300);
INSERT INTO AuthorPermission VALUES('cm63hi8ro001s7044h96tgsjf','view','article_category','own','draft','',1737283107300,1737283107300);
INSERT INTO AuthorPermission VALUES('cm63hi8ro001t70449jobbebc','create','article_category','own','draft','',1737283107301,1737283107301);
INSERT INTO AuthorPermission VALUES('cm63hi8rp001u7044zvnix0c0','update','article_category','own','draft','',1737283107301,1737283107301);
INSERT INTO AuthorPermission VALUES('cm63hi8rp001v7044bhupc3bv','delete','article_category','own','draft','',1737283107302,1737283107302);
INSERT INTO AuthorPermission VALUES('cm63hi8rr001w7044729xru1p','publish','article_category','own','draft','',1737283107303,1737283107303);
INSERT INTO AuthorPermission VALUES('cm63hi8rs001x7044itaziiag','retract','article_category','own','draft','',1737283107304,1737283107304);
INSERT INTO AuthorPermission VALUES('cm63hi8rt001y7044bxma5v1a','archive','article_category','own','draft','',1737283107305,1737283107305);
INSERT INTO AuthorPermission VALUES('cm63hi8rv001z7044ifhmhk4t','restore','article_category','own','draft','',1737283107307,1737283107307);
INSERT INTO AuthorPermission VALUES('cm63hi8rw00207044uqo1ovcv','view','article_category','any','draft','',1737283107308,1737283107308);
INSERT INTO AuthorPermission VALUES('cm63hi8rw00217044l2g8qz96','create','article_category','any','draft','',1737283107309,1737283107309);
INSERT INTO AuthorPermission VALUES('cm63hi8rx00227044550dk1jo','update','article_category','any','draft','',1737283107310,1737283107310);
INSERT INTO AuthorPermission VALUES('cm63hi8ry00237044wq9tvqnk','delete','article_category','any','draft','',1737283107310,1737283107310);
INSERT INTO AuthorPermission VALUES('cm63hi8rz00247044kc75kysl','publish','article_category','any','draft','',1737283107311,1737283107311);
INSERT INTO AuthorPermission VALUES('cm63hi8rz00257044h8wqfrhe','retract','article_category','any','draft','',1737283107312,1737283107312);
INSERT INTO AuthorPermission VALUES('cm63hi8s000267044em0e7233','archive','article_category','any','draft','',1737283107312,1737283107312);
INSERT INTO AuthorPermission VALUES('cm63hi8s0002770445e1wjiy1','restore','article_category','any','draft','',1737283107313,1737283107313);
INSERT INTO AuthorPermission VALUES('cm63hi8s100287044jtgmsnbo','view','article_category','own','published','',1737283107314,1737283107314);
INSERT INTO AuthorPermission VALUES('cm63hi8s2002970442txh8hrj','create','article_category','own','published','',1737283107314,1737283107314);
INSERT INTO AuthorPermission VALUES('cm63hi8s3002a7044ejgwcjq8','update','article_category','own','published','',1737283107315,1737283107315);
INSERT INTO AuthorPermission VALUES('cm63hi8s4002b7044pfovx0sj','delete','article_category','own','published','',1737283107316,1737283107316);
INSERT INTO AuthorPermission VALUES('cm63hi8s5002c7044it5e3qml','publish','article_category','own','published','',1737283107317,1737283107317);
INSERT INTO AuthorPermission VALUES('cm63hi8s5002d7044us6xp69y','retract','article_category','own','published','',1737283107318,1737283107318);
INSERT INTO AuthorPermission VALUES('cm63hi8s6002e7044bnsg6znb','archive','article_category','own','published','',1737283107318,1737283107318);
INSERT INTO AuthorPermission VALUES('cm63hi8s6002f704457ud33hu','restore','article_category','own','published','',1737283107319,1737283107319);
INSERT INTO AuthorPermission VALUES('cm63hi8s7002g7044hicoxsg3','view','article_category','any','published','',1737283107319,1737283107319);
INSERT INTO AuthorPermission VALUES('cm63hi8s7002h7044n4kxbdht','create','article_category','any','published','',1737283107320,1737283107320);
INSERT INTO AuthorPermission VALUES('cm63hi8s8002i7044lbm7ek2x','update','article_category','any','published','',1737283107320,1737283107320);
INSERT INTO AuthorPermission VALUES('cm63hi8s8002j7044cgdu4upi','delete','article_category','any','published','',1737283107321,1737283107321);
INSERT INTO AuthorPermission VALUES('cm63hi8s9002k7044pwbjrwxe','publish','article_category','any','published','',1737283107321,1737283107321);
INSERT INTO AuthorPermission VALUES('cm63hi8s9002l7044829mfovp','retract','article_category','any','published','',1737283107322,1737283107322);
INSERT INTO AuthorPermission VALUES('cm63hi8sa002m70444ipmi7ci','archive','article_category','any','published','',1737283107322,1737283107322);
INSERT INTO AuthorPermission VALUES('cm63hi8sa002n7044la2axbav','restore','article_category','any','published','',1737283107323,1737283107323);
INSERT INTO AuthorPermission VALUES('cm63hi8sb002o70443jnye3fm','view','article_category','own','archived','',1737283107324,1737283107324);
INSERT INTO AuthorPermission VALUES('cm63hi8sp002p7044bzvddgaw','create','article_category','own','archived','',1737283107337,1737283107337);
INSERT INTO AuthorPermission VALUES('cm63hi8sq002q7044iuoa677d','update','article_category','own','archived','',1737283107338,1737283107338);
INSERT INTO AuthorPermission VALUES('cm63hi8sq002r7044iip3trc3','delete','article_category','own','archived','',1737283107339,1737283107339);
INSERT INTO AuthorPermission VALUES('cm63hi8sr002s7044xt2dxpd7','publish','article_category','own','archived','',1737283107339,1737283107339);
INSERT INTO AuthorPermission VALUES('cm63hi8ss002t70449p5ndv2l','retract','article_category','own','archived','',1737283107340,1737283107340);
INSERT INTO AuthorPermission VALUES('cm63hi8ss002u7044awgh914a','archive','article_category','own','archived','',1737283107341,1737283107341);
INSERT INTO AuthorPermission VALUES('cm63hi8st002v70449sar9yvn','restore','article_category','own','archived','',1737283107341,1737283107341);
INSERT INTO AuthorPermission VALUES('cm63hi8su002w70449spwi7os','view','article_category','any','archived','',1737283107342,1737283107342);
INSERT INTO AuthorPermission VALUES('cm63hi8su002x7044vy5q4iky','create','article_category','any','archived','',1737283107343,1737283107343);
INSERT INTO AuthorPermission VALUES('cm63hi8sv002y7044cmy7wm7u','update','article_category','any','archived','',1737283107343,1737283107343);
INSERT INTO AuthorPermission VALUES('cm63hi8sv002z7044wpk9k78z','delete','article_category','any','archived','',1737283107344,1737283107344);
INSERT INTO AuthorPermission VALUES('cm63hi8sw00307044z0jymstm','publish','article_category','any','archived','',1737283107344,1737283107344);
INSERT INTO AuthorPermission VALUES('cm63hi8sw0031704453fi3019','retract','article_category','any','archived','',1737283107345,1737283107345);
INSERT INTO AuthorPermission VALUES('cm63hi8sx00327044skw2e2gh','archive','article_category','any','archived','',1737283107345,1737283107345);
INSERT INTO AuthorPermission VALUES('cm63hi8sx00337044ldjbas1g','restore','article_category','any','archived','',1737283107345,1737283107345);
INSERT INTO AuthorPermission VALUES('cm63hi8sx00347044p1nc5gzb','view','article_tag','own','draft','',1737283107346,1737283107346);
INSERT INTO AuthorPermission VALUES('cm63hi8sy00357044xw3s2sft','create','article_tag','own','draft','',1737283107346,1737283107346);
INSERT INTO AuthorPermission VALUES('cm63hi8sy003670442sgs6inm','update','article_tag','own','draft','',1737283107347,1737283107347);
INSERT INTO AuthorPermission VALUES('cm63hi8sz003770444y84mprq','delete','article_tag','own','draft','',1737283107347,1737283107347);
INSERT INTO AuthorPermission VALUES('cm63hi8t0003870443hjtqxjb','publish','article_tag','own','draft','',1737283107348,1737283107348);
INSERT INTO AuthorPermission VALUES('cm63hi8t100397044y2m7r1s9','retract','article_tag','own','draft','',1737283107349,1737283107349);
INSERT INTO AuthorPermission VALUES('cm63hi8t2003a7044f2k0xqe7','archive','article_tag','own','draft','',1737283107350,1737283107350);
INSERT INTO AuthorPermission VALUES('cm63hi8t3003b7044quea3o9y','restore','article_tag','own','draft','',1737283107351,1737283107351);
INSERT INTO AuthorPermission VALUES('cm63hi8t4003c7044jbyic5vs','view','article_tag','any','draft','',1737283107352,1737283107352);
INSERT INTO AuthorPermission VALUES('cm63hi8t4003d7044z0zpb4ap','create','article_tag','any','draft','',1737283107353,1737283107353);
INSERT INTO AuthorPermission VALUES('cm63hi8t5003e7044gf7tsz2l','update','article_tag','any','draft','',1737283107354,1737283107354);
INSERT INTO AuthorPermission VALUES('cm63hi8t6003f7044jv4p9gvz','delete','article_tag','any','draft','',1737283107354,1737283107354);
INSERT INTO AuthorPermission VALUES('cm63hi8t6003g7044a7rij2bn','publish','article_tag','any','draft','',1737283107355,1737283107355);
INSERT INTO AuthorPermission VALUES('cm63hi8t7003h7044xnf7822v','retract','article_tag','any','draft','',1737283107355,1737283107355);
INSERT INTO AuthorPermission VALUES('cm63hi8t7003i7044t2qtth73','archive','article_tag','any','draft','',1737283107356,1737283107356);
INSERT INTO AuthorPermission VALUES('cm63hi8t8003j7044jkz3e8am','restore','article_tag','any','draft','',1737283107356,1737283107356);
INSERT INTO AuthorPermission VALUES('cm63hi8t8003k7044gc84rwgs','view','article_tag','own','published','',1737283107357,1737283107357);
INSERT INTO AuthorPermission VALUES('cm63hi8t9003l7044mc591xui','create','article_tag','own','published','',1737283107358,1737283107358);
INSERT INTO AuthorPermission VALUES('cm63hi8ta003m7044x4zh3o2m','update','article_tag','own','published','',1737283107358,1737283107358);
INSERT INTO AuthorPermission VALUES('cm63hi8ta003n7044bh746zsy','delete','article_tag','own','published','',1737283107359,1737283107359);
INSERT INTO AuthorPermission VALUES('cm63hi8tb003o7044wc9okmuh','publish','article_tag','own','published','',1737283107359,1737283107359);
INSERT INTO AuthorPermission VALUES('cm63hi8tb003p7044vl473ozf','retract','article_tag','own','published','',1737283107360,1737283107360);
INSERT INTO AuthorPermission VALUES('cm63hi8tc003q7044pn2ba39z','archive','article_tag','own','published','',1737283107360,1737283107360);
INSERT INTO AuthorPermission VALUES('cm63hi8tc003r7044p9lkcac1','restore','article_tag','own','published','',1737283107361,1737283107361);
INSERT INTO AuthorPermission VALUES('cm63hi8td003s7044xw3qljs4','view','article_tag','any','published','',1737283107361,1737283107361);
INSERT INTO AuthorPermission VALUES('cm63hi8te003t7044mdvznkxs','create','article_tag','any','published','',1737283107362,1737283107362);
INSERT INTO AuthorPermission VALUES('cm63hi8tf003u7044z5exkxep','update','article_tag','any','published','',1737283107363,1737283107363);
INSERT INTO AuthorPermission VALUES('cm63hi8tf003v7044b8vnil57','delete','article_tag','any','published','',1737283107364,1737283107364);
INSERT INTO AuthorPermission VALUES('cm63hi8tg003w7044mfxbluf1','publish','article_tag','any','published','',1737283107364,1737283107364);
INSERT INTO AuthorPermission VALUES('cm63hi8tg003x704482h7d1wb','retract','article_tag','any','published','',1737283107365,1737283107365);
INSERT INTO AuthorPermission VALUES('cm63hi8th003y7044xti70oz9','archive','article_tag','any','published','',1737283107365,1737283107365);
INSERT INTO AuthorPermission VALUES('cm63hi8th003z7044xr8214e8','restore','article_tag','any','published','',1737283107366,1737283107366);
INSERT INTO AuthorPermission VALUES('cm63hi8ti00407044gfidjhqt','view','article_tag','own','archived','',1737283107366,1737283107366);
INSERT INTO AuthorPermission VALUES('cm63hi8tj004170448x2wzb8t','create','article_tag','own','archived','',1737283107367,1737283107367);
INSERT INTO AuthorPermission VALUES('cm63hi8tj00427044z306hzvt','update','article_tag','own','archived','',1737283107367,1737283107367);
INSERT INTO AuthorPermission VALUES('cm63hi8tj00437044ngomax8u','delete','article_tag','own','archived','',1737283107368,1737283107368);
INSERT INTO AuthorPermission VALUES('cm63hi8tk00447044ilr60ale','publish','article_tag','own','archived','',1737283107368,1737283107368);
INSERT INTO AuthorPermission VALUES('cm63hi8tk00457044y9anyfsi','retract','article_tag','own','archived','',1737283107369,1737283107369);
INSERT INTO AuthorPermission VALUES('cm63hi8tl00467044zwi8k1d0','archive','article_tag','own','archived','',1737283107369,1737283107369);
INSERT INTO AuthorPermission VALUES('cm63hi8tl00477044cl0cgzb0','restore','article_tag','own','archived','',1737283107369,1737283107369);
INSERT INTO AuthorPermission VALUES('cm63hi8tl00487044m3t7nmeq','view','article_tag','any','archived','',1737283107370,1737283107370);
INSERT INTO AuthorPermission VALUES('cm63hi8tm00497044pwnx8379','create','article_tag','any','archived','',1737283107370,1737283107370);
INSERT INTO AuthorPermission VALUES('cm63hi8tm004a7044y9ym13ns','update','article_tag','any','archived','',1737283107371,1737283107371);
INSERT INTO AuthorPermission VALUES('cm63hi8tn004b70442i8t6jbk','delete','article_tag','any','archived','',1737283107371,1737283107371);
INSERT INTO AuthorPermission VALUES('cm63hi8to004c7044u09u0u44','publish','article_tag','any','archived','',1737283107372,1737283107372);
INSERT INTO AuthorPermission VALUES('cm63hi8to004d70446w824k39','retract','article_tag','any','archived','',1737283107373,1737283107373);
INSERT INTO AuthorPermission VALUES('cm63hi8tq004e7044eqnabqlq','archive','article_tag','any','archived','',1737283107374,1737283107374);
INSERT INTO AuthorPermission VALUES('cm63hi8tr004f7044os1hhxzg','restore','article_tag','any','archived','',1737283107376,1737283107376);
INSERT INTO AuthorPermission VALUES('cm63hi8ts004g70442tdv72o9','view','podcast','own','draft','',1737283107376,1737283107376);
INSERT INTO AuthorPermission VALUES('cm63hi8ts004h704437wa4x1k','create','podcast','own','draft','',1737283107377,1737283107377);
INSERT INTO AuthorPermission VALUES('cm63hi8tt004i7044jr2i2l2h','update','podcast','own','draft','',1737283107377,1737283107377);
INSERT INTO AuthorPermission VALUES('cm63hi8tt004j7044d3aom9ye','delete','podcast','own','draft','',1737283107378,1737283107378);
INSERT INTO AuthorPermission VALUES('cm63hi8tu004k7044hk8zwrno','publish','podcast','own','draft','',1737283107378,1737283107378);
INSERT INTO AuthorPermission VALUES('cm63hi8tu004l70444xh6iirz','retract','podcast','own','draft','',1737283107379,1737283107379);
INSERT INTO AuthorPermission VALUES('cm63hi8tv004m7044baib5vjb','archive','podcast','own','draft','',1737283107379,1737283107379);
INSERT INTO AuthorPermission VALUES('cm63hi8tv004n70444n9v6ve5','restore','podcast','own','draft','',1737283107380,1737283107380);
INSERT INTO AuthorPermission VALUES('cm63hi8tw004o7044vu044lv2','view','podcast','any','draft','',1737283107380,1737283107380);
INSERT INTO AuthorPermission VALUES('cm63hi8tw004p7044rx5fl72p','create','podcast','any','draft','',1737283107381,1737283107381);
INSERT INTO AuthorPermission VALUES('cm63hi8tx004q7044wl5cwqip','update','podcast','any','draft','',1737283107381,1737283107381);
INSERT INTO AuthorPermission VALUES('cm63hi8tx004r7044ickv98vd','delete','podcast','any','draft','',1737283107382,1737283107382);
INSERT INTO AuthorPermission VALUES('cm63hi8ty004s7044vcqab0vo','publish','podcast','any','draft','',1737283107383,1737283107383);
INSERT INTO AuthorPermission VALUES('cm63hi8tz004t70446e63ym8s','retract','podcast','any','draft','',1737283107383,1737283107383);
INSERT INTO AuthorPermission VALUES('cm63hi8tz004u7044y833xnsp','archive','podcast','any','draft','',1737283107384,1737283107384);
INSERT INTO AuthorPermission VALUES('cm63hi8u0004v704438ln9l5y','restore','podcast','any','draft','',1737283107384,1737283107384);
INSERT INTO AuthorPermission VALUES('cm63hi8u0004w70446kvn69i5','view','podcast','own','published','',1737283107385,1737283107385);
INSERT INTO AuthorPermission VALUES('cm63hi8u1004x70448mia6t4t','create','podcast','own','published','',1737283107385,1737283107385);
INSERT INTO AuthorPermission VALUES('cm63hi8u1004y7044gyux931d','update','podcast','own','published','',1737283107386,1737283107386);
INSERT INTO AuthorPermission VALUES('cm63hi8u1004z704460326cwy','delete','podcast','own','published','',1737283107386,1737283107386);
INSERT INTO AuthorPermission VALUES('cm63hi8u200507044ou81eyb8','publish','podcast','own','published','',1737283107386,1737283107386);
INSERT INTO AuthorPermission VALUES('cm63hi8u200517044stg0dnt3','retract','podcast','own','published','',1737283107387,1737283107387);
INSERT INTO AuthorPermission VALUES('cm63hi8u300527044lrlw3z9c','archive','podcast','own','published','',1737283107387,1737283107387);
INSERT INTO AuthorPermission VALUES('cm63hi8u300537044nkjvf78q','restore','podcast','own','published','',1737283107388,1737283107388);
INSERT INTO AuthorPermission VALUES('cm63hi8u400547044vpttvokt','view','podcast','any','published','',1737283107388,1737283107388);
INSERT INTO AuthorPermission VALUES('cm63hi8u4005570443flj3ewo','create','podcast','any','published','',1737283107389,1737283107389);
INSERT INTO AuthorPermission VALUES('cm63hi8u4005670446u8q7qcu','update','podcast','any','published','',1737283107389,1737283107389);
INSERT INTO AuthorPermission VALUES('cm63hi8u500577044ycmnsy0u','delete','podcast','any','published','',1737283107389,1737283107389);
INSERT INTO AuthorPermission VALUES('cm63hi8u500587044xcd2unqd','publish','podcast','any','published','',1737283107390,1737283107390);
INSERT INTO AuthorPermission VALUES('cm63hi8u600597044t0w2nzew','retract','podcast','any','published','',1737283107390,1737283107390);
INSERT INTO AuthorPermission VALUES('cm63hi8u6005a7044px0m7eiw','archive','podcast','any','published','',1737283107391,1737283107391);
INSERT INTO AuthorPermission VALUES('cm63hi8u7005b7044pg84604w','restore','podcast','any','published','',1737283107391,1737283107391);
INSERT INTO AuthorPermission VALUES('cm63hi8u7005c7044onkvo2hj','view','podcast','own','archived','',1737283107392,1737283107392);
INSERT INTO AuthorPermission VALUES('cm63hi8u8005d7044q9c1wm1j','create','podcast','own','archived','',1737283107392,1737283107392);
INSERT INTO AuthorPermission VALUES('cm63hi8u8005e7044iq0fnq9d','update','podcast','own','archived','',1737283107392,1737283107392);
INSERT INTO AuthorPermission VALUES('cm63hi8u8005f7044i414ikhz','delete','podcast','own','archived','',1737283107393,1737283107393);
INSERT INTO AuthorPermission VALUES('cm63hi8u9005g7044d5yrj01m','publish','podcast','own','archived','',1737283107394,1737283107394);
INSERT INTO AuthorPermission VALUES('cm63hi8ua005h7044u0ctzevp','retract','podcast','own','archived','',1737283107394,1737283107394);
INSERT INTO AuthorPermission VALUES('cm63hi8ua005i7044k2ma793t','archive','podcast','own','archived','',1737283107395,1737283107395);
INSERT INTO AuthorPermission VALUES('cm63hi8ub005j704436v70qbw','restore','podcast','own','archived','',1737283107396,1737283107396);
INSERT INTO AuthorPermission VALUES('cm63hi8uc005k70448fbz0sz4','view','podcast','any','archived','',1737283107396,1737283107396);
INSERT INTO AuthorPermission VALUES('cm63hi8ud005l7044emhf02kb','create','podcast','any','archived','',1737283107397,1737283107397);
INSERT INTO AuthorPermission VALUES('cm63hi8ue005m7044iurtl9vg','update','podcast','any','archived','',1737283107398,1737283107398);
INSERT INTO AuthorPermission VALUES('cm63hi8ue005n7044mwko78vq','delete','podcast','any','archived','',1737283107399,1737283107399);
INSERT INTO AuthorPermission VALUES('cm63hi8uf005o7044jkpk1tpn','publish','podcast','any','archived','',1737283107400,1737283107400);
INSERT INTO AuthorPermission VALUES('cm63hi8ug005p7044ipxs07p4','retract','podcast','any','archived','',1737283107400,1737283107400);
INSERT INTO AuthorPermission VALUES('cm63hi8ug005q7044amcf6vhp','archive','podcast','any','archived','',1737283107401,1737283107401);
INSERT INTO AuthorPermission VALUES('cm63hi8uh005r704488imb99f','restore','podcast','any','archived','',1737283107401,1737283107401);
INSERT INTO AuthorPermission VALUES('cm63hi8uh005s7044fx7cqz30','view','podcast_episode','own','draft','',1737283107402,1737283107402);
INSERT INTO AuthorPermission VALUES('cm63hi8ui005t70446ikq9iqt','create','podcast_episode','own','draft','',1737283107402,1737283107402);
INSERT INTO AuthorPermission VALUES('cm63hi8ui005u7044ykab34df','update','podcast_episode','own','draft','',1737283107403,1737283107403);
INSERT INTO AuthorPermission VALUES('cm63hi8uj005v704406k4asvm','delete','podcast_episode','own','draft','',1737283107403,1737283107403);
INSERT INTO AuthorPermission VALUES('cm63hi8uj005w7044mu7kr6w7','publish','podcast_episode','own','draft','',1737283107403,1737283107403);
INSERT INTO AuthorPermission VALUES('cm63hi8uj005x7044egh8fffi','retract','podcast_episode','own','draft','',1737283107404,1737283107404);
INSERT INTO AuthorPermission VALUES('cm63hi8uk005y7044rj3q5u2r','archive','podcast_episode','own','draft','',1737283107404,1737283107404);
INSERT INTO AuthorPermission VALUES('cm63hi8uk005z704464k0qc0g','restore','podcast_episode','own','draft','',1737283107405,1737283107405);
INSERT INTO AuthorPermission VALUES('cm63hi8ul00607044czj9yj3b','view','podcast_episode','any','draft','',1737283107405,1737283107405);
INSERT INTO AuthorPermission VALUES('cm63hi8ul00617044dsfwy3bv','create','podcast_episode','any','draft','',1737283107406,1737283107406);
INSERT INTO AuthorPermission VALUES('cm63hi8um00627044fa7dr75h','update','podcast_episode','any','draft','',1737283107406,1737283107406);
INSERT INTO AuthorPermission VALUES('cm63hi8um00637044wwtvawoz','delete','podcast_episode','any','draft','',1737283107407,1737283107407);
INSERT INTO AuthorPermission VALUES('cm63hi8un00647044alyrubs8','publish','podcast_episode','any','draft','',1737283107407,1737283107407);
INSERT INTO AuthorPermission VALUES('cm63hi8uo006570444kdoi1bx','retract','podcast_episode','any','draft','',1737283107408,1737283107408);
INSERT INTO AuthorPermission VALUES('cm63hi8uo00667044mlffocft','archive','podcast_episode','any','draft','',1737283107409,1737283107409);
INSERT INTO AuthorPermission VALUES('cm63hi8up00677044npfhka65','restore','podcast_episode','any','draft','',1737283107409,1737283107409);
INSERT INTO AuthorPermission VALUES('cm63hi8up00687044r61zbqt1','view','podcast_episode','own','published','',1737283107410,1737283107410);
INSERT INTO AuthorPermission VALUES('cm63hi8uq00697044jektu9p0','create','podcast_episode','own','published','',1737283107411,1737283107411);
INSERT INTO AuthorPermission VALUES('cm63hi8ur006a7044e6mkv8oc','update','podcast_episode','own','published','',1737283107411,1737283107411);
INSERT INTO AuthorPermission VALUES('cm63hi8ur006b7044qy0gnejw','delete','podcast_episode','own','published','',1737283107412,1737283107412);
INSERT INTO AuthorPermission VALUES('cm63hi8us006c7044f8m80qmn','publish','podcast_episode','own','published','',1737283107412,1737283107412);
INSERT INTO AuthorPermission VALUES('cm63hi8us006d7044mr8qhax9','retract','podcast_episode','own','published','',1737283107413,1737283107413);
INSERT INTO AuthorPermission VALUES('cm63hi8ut006e7044ox4t0g6p','archive','podcast_episode','own','published','',1737283107413,1737283107413);
INSERT INTO AuthorPermission VALUES('cm63hi8uu006f7044j63cc2vb','restore','podcast_episode','own','published','',1737283107414,1737283107414);
INSERT INTO AuthorPermission VALUES('cm63hi8uu006g7044at49ftey','view','podcast_episode','any','published','',1737283107415,1737283107415);
INSERT INTO AuthorPermission VALUES('cm63hi8uv006h7044tu63j5km','create','podcast_episode','any','published','',1737283107416,1737283107416);
INSERT INTO AuthorPermission VALUES('cm63hi8uw006i7044fvf7c4t9','update','podcast_episode','any','published','',1737283107417,1737283107417);
INSERT INTO AuthorPermission VALUES('cm63hi8ux006j704411bdm1dp','delete','podcast_episode','any','published','',1737283107417,1737283107417);
INSERT INTO AuthorPermission VALUES('cm63hi8ux006k7044j91384jw','publish','podcast_episode','any','published','',1737283107418,1737283107418);
INSERT INTO AuthorPermission VALUES('cm63hi8uy006l7044ml7miomw','retract','podcast_episode','any','published','',1737283107418,1737283107418);
INSERT INTO AuthorPermission VALUES('cm63hi8uy006m7044591rcqae','archive','podcast_episode','any','published','',1737283107419,1737283107419);
INSERT INTO AuthorPermission VALUES('cm63hi8uz006n7044jaglawpw','restore','podcast_episode','any','published','',1737283107420,1737283107420);
INSERT INTO AuthorPermission VALUES('cm63hi8v0006o7044asl05a08','view','podcast_episode','own','archived','',1737283107421,1737283107421);
INSERT INTO AuthorPermission VALUES('cm63hi8v1006p7044e1fmwqxi','create','podcast_episode','own','archived','',1737283107422,1737283107422);
INSERT INTO AuthorPermission VALUES('cm63hi8v3006q7044yplvgtbm','update','podcast_episode','own','archived','',1737283107423,1737283107423);
INSERT INTO AuthorPermission VALUES('cm63hi8v3006r7044yyouq2tf','delete','podcast_episode','own','archived','',1737283107424,1737283107424);
INSERT INTO AuthorPermission VALUES('cm63hi8v4006s70445on8gpzn','publish','podcast_episode','own','archived','',1737283107424,1737283107424);
INSERT INTO AuthorPermission VALUES('cm63hi8v4006t70449v2f0zm3','retract','podcast_episode','own','archived','',1737283107425,1737283107425);
INSERT INTO AuthorPermission VALUES('cm63hi8v5006u7044om7mjhz5','archive','podcast_episode','own','archived','',1737283107425,1737283107425);
INSERT INTO AuthorPermission VALUES('cm63hi8v5006v7044ky93tmdw','restore','podcast_episode','own','archived','',1737283107426,1737283107426);
INSERT INTO AuthorPermission VALUES('cm63hi8v6006w7044smslsbna','view','podcast_episode','any','archived','',1737283107426,1737283107426);
INSERT INTO AuthorPermission VALUES('cm63hi8v6006x7044p1fsuy0s','create','podcast_episode','any','archived','',1737283107427,1737283107427);
INSERT INTO AuthorPermission VALUES('cm63hi8v7006y7044h92wvwj3','update','podcast_episode','any','archived','',1737283107427,1737283107427);
INSERT INTO AuthorPermission VALUES('cm63hi8v7006z7044ti75h03s','delete','podcast_episode','any','archived','',1737283107428,1737283107428);
INSERT INTO AuthorPermission VALUES('cm63hi8v800707044tyhcjdzp','publish','podcast_episode','any','archived','',1737283107428,1737283107428);
INSERT INTO AuthorPermission VALUES('cm63hi8v800717044c3zlk2e7','retract','podcast_episode','any','archived','',1737283107428,1737283107428);
INSERT INTO AuthorPermission VALUES('cm63hi8v900727044e9kqujb8','archive','podcast_episode','any','archived','',1737283107429,1737283107429);
INSERT INTO AuthorPermission VALUES('cm63hi8v9007370446yu4hl7n','restore','podcast_episode','any','archived','',1737283107429,1737283107429);
INSERT INTO AuthorPermission VALUES('cm63hi8v900747044zav78mxu','view','podcast_episode_link','own','draft','',1737283107430,1737283107430);
INSERT INTO AuthorPermission VALUES('cm63hi8va00757044aa0x3wu4','create','podcast_episode_link','own','draft','',1737283107430,1737283107430);
INSERT INTO AuthorPermission VALUES('cm63hi8va00767044d9dez39g','update','podcast_episode_link','own','draft','',1737283107431,1737283107431);
INSERT INTO AuthorPermission VALUES('cm63hi8vb007770446cd21gib','delete','podcast_episode_link','own','draft','',1737283107431,1737283107431);
INSERT INTO AuthorPermission VALUES('cm63hi8vb007870440fqws1pv','publish','podcast_episode_link','own','draft','',1737283107432,1737283107432);
INSERT INTO AuthorPermission VALUES('cm63hi8vc00797044xxv4l4d8','retract','podcast_episode_link','own','draft','',1737283107432,1737283107432);
INSERT INTO AuthorPermission VALUES('cm63hi8vc007a7044uryyhcip','archive','podcast_episode_link','own','draft','',1737283107433,1737283107433);
INSERT INTO AuthorPermission VALUES('cm63hi8vd007b7044dj06hl6h','restore','podcast_episode_link','own','draft','',1737283107433,1737283107433);
INSERT INTO AuthorPermission VALUES('cm63hi8vd007c7044p55ab8at','view','podcast_episode_link','any','draft','',1737283107434,1737283107434);
INSERT INTO AuthorPermission VALUES('cm63hi8ve007d7044l6y4hyn3','create','podcast_episode_link','any','draft','',1737283107434,1737283107434);
INSERT INTO AuthorPermission VALUES('cm63hi8ve007e7044mivyt97b','update','podcast_episode_link','any','draft','',1737283107435,1737283107435);
INSERT INTO AuthorPermission VALUES('cm63hi8vf007f704409n6odia','delete','podcast_episode_link','any','draft','',1737283107435,1737283107435);
INSERT INTO AuthorPermission VALUES('cm63hi8vf007g7044fo9xo71o','publish','podcast_episode_link','any','draft','',1737283107436,1737283107436);
INSERT INTO AuthorPermission VALUES('cm63hi8vg007h7044smnt8qg1','retract','podcast_episode_link','any','draft','',1737283107436,1737283107436);
INSERT INTO AuthorPermission VALUES('cm63hi8vg007i7044ckxqhvvu','archive','podcast_episode_link','any','draft','',1737283107437,1737283107437);
INSERT INTO AuthorPermission VALUES('cm63hi8vh007j70442ngs1hcz','restore','podcast_episode_link','any','draft','',1737283107437,1737283107437);
INSERT INTO AuthorPermission VALUES('cm63hi8vh007k70442a6krv7u','view','podcast_episode_link','own','published','',1737283107438,1737283107438);
INSERT INTO AuthorPermission VALUES('cm63hi8vi007l7044258twnd7','create','podcast_episode_link','own','published','',1737283107438,1737283107438);
INSERT INTO AuthorPermission VALUES('cm63hi8vi007m70444f5o9wc3','update','podcast_episode_link','own','published','',1737283107439,1737283107439);
INSERT INTO AuthorPermission VALUES('cm63hi8vj007n7044q793a7u3','delete','podcast_episode_link','own','published','',1737283107439,1737283107439);
INSERT INTO AuthorPermission VALUES('cm63hi8vj007o7044lb0an0nu','publish','podcast_episode_link','own','published','',1737283107440,1737283107440);
INSERT INTO AuthorPermission VALUES('cm63hi8vk007p7044xbsrb0op','retract','podcast_episode_link','own','published','',1737283107440,1737283107440);
INSERT INTO AuthorPermission VALUES('cm63hi8vk007q7044momiiied','archive','podcast_episode_link','own','published','',1737283107440,1737283107440);
INSERT INTO AuthorPermission VALUES('cm63hi8vk007r7044w3xs0s6b','restore','podcast_episode_link','own','published','',1737283107441,1737283107441);
INSERT INTO AuthorPermission VALUES('cm63hi8vl007s7044xzy61aab','view','podcast_episode_link','any','published','',1737283107441,1737283107441);
INSERT INTO AuthorPermission VALUES('cm63hi8vl007t7044smydmsw7','create','podcast_episode_link','any','published','',1737283107442,1737283107442);
INSERT INTO AuthorPermission VALUES('cm63hi8vm007u704458v0oltj','update','podcast_episode_link','any','published','',1737283107442,1737283107442);
INSERT INTO AuthorPermission VALUES('cm63hi8vm007v7044484vezbb','delete','podcast_episode_link','any','published','',1737283107443,1737283107443);
INSERT INTO AuthorPermission VALUES('cm63hi8vn007w7044aapztu5m','publish','podcast_episode_link','any','published','',1737283107443,1737283107443);
INSERT INTO AuthorPermission VALUES('cm63hi8vo007x7044vno6mfzz','retract','podcast_episode_link','any','published','',1737283107444,1737283107444);
INSERT INTO AuthorPermission VALUES('cm63hi8vp007y7044zomph6uv','archive','podcast_episode_link','any','published','',1737283107445,1737283107445);
INSERT INTO AuthorPermission VALUES('cm63hi8vq007z7044t9xu8fk9','restore','podcast_episode_link','any','published','',1737283107446,1737283107446);
INSERT INTO AuthorPermission VALUES('cm63hi8vq008070448l7q3f3x','view','podcast_episode_link','own','archived','',1737283107447,1737283107447);
INSERT INTO AuthorPermission VALUES('cm63hi8vr00817044z4kylu2w','create','podcast_episode_link','own','archived','',1737283107448,1737283107448);
INSERT INTO AuthorPermission VALUES('cm63hi8vs00827044p6doqpvs','update','podcast_episode_link','own','archived','',1737283107449,1737283107449);
INSERT INTO AuthorPermission VALUES('cm63hi8vt008370444w3x8v49','delete','podcast_episode_link','own','archived','',1737283107449,1737283107449);
INSERT INTO AuthorPermission VALUES('cm63hi8vt00847044w33tnp39','publish','podcast_episode_link','own','archived','',1737283107450,1737283107450);
INSERT INTO AuthorPermission VALUES('cm63hi8vu00857044g722sgjx','retract','podcast_episode_link','own','archived','',1737283107450,1737283107450);
INSERT INTO AuthorPermission VALUES('cm63hi8vu00867044xx36wr68','archive','podcast_episode_link','own','archived','',1737283107451,1737283107451);
INSERT INTO AuthorPermission VALUES('cm63hi8vv00877044ugajfnff','restore','podcast_episode_link','own','archived','',1737283107451,1737283107451);
INSERT INTO AuthorPermission VALUES('cm63hi8vv00887044vbzodkcz','view','podcast_episode_link','any','archived','',1737283107452,1737283107452);
INSERT INTO AuthorPermission VALUES('cm63hi8vv00897044i3q5f2s0','create','podcast_episode_link','any','archived','',1737283107452,1737283107452);
INSERT INTO AuthorPermission VALUES('cm63hi8vw008a7044y86yqzzh','update','podcast_episode_link','any','archived','',1737283107452,1737283107452);
INSERT INTO AuthorPermission VALUES('cm63hi8vw008b7044ar3gfz9o','delete','podcast_episode_link','any','archived','',1737283107453,1737283107453);
INSERT INTO AuthorPermission VALUES('cm63hi8vx008c7044sxviv8n8','publish','podcast_episode_link','any','archived','',1737283107453,1737283107453);
INSERT INTO AuthorPermission VALUES('cm63hi8vx008d70442tel6491','retract','podcast_episode_link','any','archived','',1737283107454,1737283107454);
INSERT INTO AuthorPermission VALUES('cm63hi8vy008e7044diep22yi','archive','podcast_episode_link','any','archived','',1737283107454,1737283107454);
INSERT INTO AuthorPermission VALUES('cm63hi8vy008f7044tuqjhhwa','restore','podcast_episode_link','any','archived','',1737283107455,1737283107455);
INSERT INTO AuthorPermission VALUES('cm63hi8vz008g70445apvqdko','view','issue','own','draft','',1737283107455,1737283107455);
INSERT INTO AuthorPermission VALUES('cm63hi8vz008h70447a6fjobs','create','issue','own','draft','',1737283107456,1737283107456);
INSERT INTO AuthorPermission VALUES('cm63hi8w0008i7044lqx1zmkp','update','issue','own','draft','',1737283107456,1737283107456);
INSERT INTO AuthorPermission VALUES('cm63hi8w1008j7044temru1up','delete','issue','own','draft','',1737283107457,1737283107457);
INSERT INTO AuthorPermission VALUES('cm63hi8w1008k7044qe745780','publish','issue','own','draft','',1737283107458,1737283107458);
INSERT INTO AuthorPermission VALUES('cm63hi8w2008l70445vvkz8h0','retract','issue','own','draft','',1737283107459,1737283107459);
INSERT INTO AuthorPermission VALUES('cm63hi8w3008m7044j2jbpzxh','archive','issue','own','draft','',1737283107459,1737283107459);
INSERT INTO AuthorPermission VALUES('cm63hi8w4008n7044ve9eihrf','restore','issue','own','draft','',1737283107460,1737283107460);
INSERT INTO AuthorPermission VALUES('cm63hi8w4008o7044znwj16e3','view','issue','any','draft','',1737283107461,1737283107461);
INSERT INTO AuthorPermission VALUES('cm63hi8w5008p7044g0y8e6tn','create','issue','any','draft','',1737283107461,1737283107461);
INSERT INTO AuthorPermission VALUES('cm63hi8w7008q7044hklkbj9v','update','issue','any','draft','',1737283107463,1737283107463);
INSERT INTO AuthorPermission VALUES('cm63hi8w8008r7044kf639s0s','delete','issue','any','draft','',1737283107464,1737283107464);
INSERT INTO AuthorPermission VALUES('cm63hi8w9008s7044pbs5r6za','publish','issue','any','draft','',1737283107466,1737283107466);
INSERT INTO AuthorPermission VALUES('cm63hi8wa008t7044qvvvpfp6','retract','issue','any','draft','',1737283107466,1737283107466);
INSERT INTO AuthorPermission VALUES('cm63hi8wc008u7044jv4v7rrb','archive','issue','any','draft','',1737283107468,1737283107468);
INSERT INTO AuthorPermission VALUES('cm63hi8wd008v7044gszquipk','restore','issue','any','draft','',1737283107470,1737283107470);
INSERT INTO AuthorPermission VALUES('cm63hi8we008w70443xg95j7p','view','issue','own','published','',1737283107471,1737283107471);
INSERT INTO AuthorPermission VALUES('cm63hi8wg008x7044dmp8uk47','create','issue','own','published','',1737283107472,1737283107472);
INSERT INTO AuthorPermission VALUES('cm63hi8wh008y7044tzqb7e3r','update','issue','own','published','',1737283107473,1737283107473);
INSERT INTO AuthorPermission VALUES('cm63hi8wh008z70445f4u0n9x','delete','issue','own','published','',1737283107474,1737283107474);
INSERT INTO AuthorPermission VALUES('cm63hi8wi00907044pl24intu','publish','issue','own','published','',1737283107474,1737283107474);
INSERT INTO AuthorPermission VALUES('cm63hi8wi00917044tj8e5h9n','retract','issue','own','published','',1737283107475,1737283107475);
INSERT INTO AuthorPermission VALUES('cm63hi8wj00927044o5h7gm0j','archive','issue','own','published','',1737283107475,1737283107475);
INSERT INTO AuthorPermission VALUES('cm63hi8wj00937044ilta3hga','restore','issue','own','published','',1737283107476,1737283107476);
INSERT INTO AuthorPermission VALUES('cm63hi8wl009470447agyomg8','view','issue','any','published','',1737283107478,1737283107478);
INSERT INTO AuthorPermission VALUES('cm63hi8wm00957044ekghivsz','create','issue','any','published','',1737283107478,1737283107478);
INSERT INTO AuthorPermission VALUES('cm63hi8wm00967044aan6f5oa','update','issue','any','published','',1737283107479,1737283107479);
INSERT INTO AuthorPermission VALUES('cm63hi8wn009770448g8999a1','delete','issue','any','published','',1737283107479,1737283107479);
INSERT INTO AuthorPermission VALUES('cm63hi8wo00987044qztwg9em','publish','issue','any','published','',1737283107480,1737283107480);
INSERT INTO AuthorPermission VALUES('cm63hi8wp009970445u3a8c79','retract','issue','any','published','',1737283107481,1737283107481);
INSERT INTO AuthorPermission VALUES('cm63hi8wq009a7044rkufjkgr','archive','issue','any','published','',1737283107482,1737283107482);
INSERT INTO AuthorPermission VALUES('cm63hi8wr009b70443md0vh2j','restore','issue','any','published','',1737283107483,1737283107483);
INSERT INTO AuthorPermission VALUES('cm63hi8wr009c7044jt3oebpd','view','issue','own','archived','',1737283107484,1737283107484);
INSERT INTO AuthorPermission VALUES('cm63hi8ws009d70448aiqsp87','create','issue','own','archived','',1737283107484,1737283107484);
INSERT INTO AuthorPermission VALUES('cm63hi8ws009e7044cn4af9jv','update','issue','own','archived','',1737283107485,1737283107485);
INSERT INTO AuthorPermission VALUES('cm63hi8wt009f7044m5ru7w68','delete','issue','own','archived','',1737283107485,1737283107485);
INSERT INTO AuthorPermission VALUES('cm63hi8wt009g7044j3x2sbuk','publish','issue','own','archived','',1737283107486,1737283107486);
INSERT INTO AuthorPermission VALUES('cm63hi8wu009h7044f9p9f7d5','retract','issue','own','archived','',1737283107486,1737283107486);
INSERT INTO AuthorPermission VALUES('cm63hi8wu009i7044jsaoettt','archive','issue','own','archived','',1737283107487,1737283107487);
INSERT INTO AuthorPermission VALUES('cm63hi8wv009j7044gczd057e','restore','issue','own','archived','',1737283107487,1737283107487);
INSERT INTO AuthorPermission VALUES('cm63hi8wv009k7044jxsrnc48','view','issue','any','archived','',1737283107488,1737283107488);
INSERT INTO AuthorPermission VALUES('cm63hi8ww009l70447y7l4qk9','create','issue','any','archived','',1737283107488,1737283107488);
INSERT INTO AuthorPermission VALUES('cm63hi8ww009m7044q8asy5yq','update','issue','any','archived','',1737283107489,1737283107489);
INSERT INTO AuthorPermission VALUES('cm63hi8wx009n70444mmgvvbf','delete','issue','any','archived','',1737283107489,1737283107489);
INSERT INTO AuthorPermission VALUES('cm63hi8wx009o7044zggm2za8','publish','issue','any','archived','',1737283107489,1737283107489);
INSERT INTO AuthorPermission VALUES('cm63hi8wx009p70447hsk875r','retract','issue','any','archived','',1737283107490,1737283107490);
INSERT INTO AuthorPermission VALUES('cm63hi8wy009q7044ritbw681','archive','issue','any','archived','',1737283107490,1737283107490);
INSERT INTO AuthorPermission VALUES('cm63hi8wy009r7044mt65qjna','restore','issue','any','archived','',1737283107491,1737283107491);
INSERT INTO AuthorPermission VALUES('cm63hi8wz009s7044fpyj0bog','view','editorial_board_position','own','draft','',1737283107491,1737283107491);
INSERT INTO AuthorPermission VALUES('cm63hi8wz009t70449ksd0l5w','create','editorial_board_position','own','draft','',1737283107492,1737283107492);
INSERT INTO AuthorPermission VALUES('cm63hi8x0009u70444pflipy3','update','editorial_board_position','own','draft','',1737283107492,1737283107492);
INSERT INTO AuthorPermission VALUES('cm63hi8x1009v7044j7vx8phv','delete','editorial_board_position','own','draft','',1737283107493,1737283107493);
INSERT INTO AuthorPermission VALUES('cm63hi8x1009w7044blg8z8a4','publish','editorial_board_position','own','draft','',1737283107494,1737283107494);
INSERT INTO AuthorPermission VALUES('cm63hi8x2009x70442pp0sjbn','retract','editorial_board_position','own','draft','',1737283107494,1737283107494);
INSERT INTO AuthorPermission VALUES('cm63hi8x3009y704490v5ioj4','archive','editorial_board_position','own','draft','',1737283107496,1737283107496);
INSERT INTO AuthorPermission VALUES('cm63hi8x4009z70445nueutz6','restore','editorial_board_position','own','draft','',1737283107497,1737283107497);
INSERT INTO AuthorPermission VALUES('cm63hi8x500a07044uzxhh5pw','view','editorial_board_position','any','draft','',1737283107497,1737283107497);
INSERT INTO AuthorPermission VALUES('cm63hi8x600a17044wa7d0fxp','create','editorial_board_position','any','draft','',1737283107498,1737283107498);
INSERT INTO AuthorPermission VALUES('cm63hi8x700a27044w4zoc851','update','editorial_board_position','any','draft','',1737283107499,1737283107499);
INSERT INTO AuthorPermission VALUES('cm63hi8x700a37044zldk6yja','delete','editorial_board_position','any','draft','',1737283107500,1737283107500);
INSERT INTO AuthorPermission VALUES('cm63hi8x800a47044qw5goy3w','publish','editorial_board_position','any','draft','',1737283107500,1737283107500);
INSERT INTO AuthorPermission VALUES('cm63hi8x800a57044ft1zjoza','retract','editorial_board_position','any','draft','',1737283107501,1737283107501);
INSERT INTO AuthorPermission VALUES('cm63hi8x900a670441raax5fn','archive','editorial_board_position','any','draft','',1737283107501,1737283107501);
INSERT INTO AuthorPermission VALUES('cm63hi8x900a77044fldp7xb6','restore','editorial_board_position','any','draft','',1737283107502,1737283107502);
INSERT INTO AuthorPermission VALUES('cm63hi8xa00a87044popgfz1a','view','editorial_board_position','own','published','',1737283107502,1737283107502);
INSERT INTO AuthorPermission VALUES('cm63hi8xa00a97044wfbesid3','create','editorial_board_position','own','published','',1737283107503,1737283107503);
INSERT INTO AuthorPermission VALUES('cm63hi8xb00aa7044h352jh6q','update','editorial_board_position','own','published','',1737283107503,1737283107503);
INSERT INTO AuthorPermission VALUES('cm63hi8xb00ab70444ksyzzb3','delete','editorial_board_position','own','published','',1737283107504,1737283107504);
INSERT INTO AuthorPermission VALUES('cm63hi8xb00ac7044t62kz8bs','publish','editorial_board_position','own','published','',1737283107504,1737283107504);
INSERT INTO AuthorPermission VALUES('cm63hi8xc00ad704474xyf9em','retract','editorial_board_position','own','published','',1737283107504,1737283107504);
INSERT INTO AuthorPermission VALUES('cm63hi8xc00ae70447erp14c1','archive','editorial_board_position','own','published','',1737283107505,1737283107505);
INSERT INTO AuthorPermission VALUES('cm63hi8xd00af7044ecy0qxv7','restore','editorial_board_position','own','published','',1737283107505,1737283107505);
INSERT INTO AuthorPermission VALUES('cm63hi8xd00ag7044ql1wexdb','view','editorial_board_position','any','published','',1737283107506,1737283107506);
INSERT INTO AuthorPermission VALUES('cm63hi8xe00ah704469z1yrag','create','editorial_board_position','any','published','',1737283107506,1737283107506);
INSERT INTO AuthorPermission VALUES('cm63hi8xe00ai7044i1v68kqi','update','editorial_board_position','any','published','',1737283107507,1737283107507);
INSERT INTO AuthorPermission VALUES('cm63hi8xf00aj7044pyu7d7lq','delete','editorial_board_position','any','published','',1737283107508,1737283107508);
INSERT INTO AuthorPermission VALUES('cm63hi8xg00ak7044sm7r9zd5','publish','editorial_board_position','any','published','',1737283107508,1737283107508);
INSERT INTO AuthorPermission VALUES('cm63hi8xh00al7044ivumhn2e','retract','editorial_board_position','any','published','',1737283107509,1737283107509);
INSERT INTO AuthorPermission VALUES('cm63hi8xh00am7044eqb12kxh','archive','editorial_board_position','any','published','',1737283107510,1737283107510);
INSERT INTO AuthorPermission VALUES('cm63hi8xi00an7044llke24qs','restore','editorial_board_position','any','published','',1737283107510,1737283107510);
INSERT INTO AuthorPermission VALUES('cm63hi8xi00ao7044qdg7yhug','view','editorial_board_position','own','archived','',1737283107511,1737283107511);
INSERT INTO AuthorPermission VALUES('cm63hi8xj00ap70449tjnwo7b','create','editorial_board_position','own','archived','',1737283107512,1737283107512);
INSERT INTO AuthorPermission VALUES('cm63hi8xk00aq7044yt6vkfgb','update','editorial_board_position','own','archived','',1737283107513,1737283107513);
INSERT INTO AuthorPermission VALUES('cm63hi8xl00ar70444thl0igy','delete','editorial_board_position','own','archived','',1737283107513,1737283107513);
INSERT INTO AuthorPermission VALUES('cm63hi8xl00as704480wgzy23','publish','editorial_board_position','own','archived','',1737283107514,1737283107514);
INSERT INTO AuthorPermission VALUES('cm63hi8xm00at70445ohcu715','retract','editorial_board_position','own','archived','',1737283107514,1737283107514);
INSERT INTO AuthorPermission VALUES('cm63hi8xm00au7044bgho9mde','archive','editorial_board_position','own','archived','',1737283107515,1737283107515);
INSERT INTO AuthorPermission VALUES('cm63hi8xn00av70449j85qqml','restore','editorial_board_position','own','archived','',1737283107515,1737283107515);
INSERT INTO AuthorPermission VALUES('cm63hi8xn00aw7044611je98p','view','editorial_board_position','any','archived','',1737283107515,1737283107515);
INSERT INTO AuthorPermission VALUES('cm63hi8xo00ax70449tr63fpi','create','editorial_board_position','any','archived','',1737283107516,1737283107516);
INSERT INTO AuthorPermission VALUES('cm63hi8xo00ay70445ryhmhi7','update','editorial_board_position','any','archived','',1737283107517,1737283107517);
INSERT INTO AuthorPermission VALUES('cm63hi8xq00az7044pih150w2','delete','editorial_board_position','any','archived','',1737283107518,1737283107518);
INSERT INTO AuthorPermission VALUES('cm63hi8xr00b070447eogc0v5','publish','editorial_board_position','any','archived','',1737283107519,1737283107519);
INSERT INTO AuthorPermission VALUES('cm63hi8xs00b17044x8bxgbya','retract','editorial_board_position','any','archived','',1737283107520,1737283107520);
INSERT INTO AuthorPermission VALUES('cm63hi8xs00b27044e9evkxvh','archive','editorial_board_position','any','archived','',1737283107521,1737283107521);
INSERT INTO AuthorPermission VALUES('cm63hi8xt00b3704457ill2m0','restore','editorial_board_position','any','archived','',1737283107521,1737283107521);
INSERT INTO AuthorPermission VALUES('cm63hi8xt00b470448grkaty9','view','editorial_board_member','own','draft','',1737283107522,1737283107522);
INSERT INTO AuthorPermission VALUES('cm63hi8xu00b570449eojfuw3','create','editorial_board_member','own','draft','',1737283107522,1737283107522);
INSERT INTO AuthorPermission VALUES('cm63hi8xu00b67044gtpc8exp','update','editorial_board_member','own','draft','',1737283107523,1737283107523);
INSERT INTO AuthorPermission VALUES('cm63hi8xv00b77044c4j2eag8','delete','editorial_board_member','own','draft','',1737283107523,1737283107523);
INSERT INTO AuthorPermission VALUES('cm63hi8xv00b870449u14p9ze','publish','editorial_board_member','own','draft','',1737283107524,1737283107524);
INSERT INTO AuthorPermission VALUES('cm63hi8xw00b97044tm87f657','retract','editorial_board_member','own','draft','',1737283107524,1737283107524);
INSERT INTO AuthorPermission VALUES('cm63hi8xw00ba70449cyhkske','archive','editorial_board_member','own','draft','',1737283107525,1737283107525);
INSERT INTO AuthorPermission VALUES('cm63hi8xw00bb7044dems6sm3','restore','editorial_board_member','own','draft','',1737283107525,1737283107525);
INSERT INTO AuthorPermission VALUES('cm63hi8xx00bc70446xpgikqg','view','editorial_board_member','any','draft','',1737283107525,1737283107525);
INSERT INTO AuthorPermission VALUES('cm63hi8xx00bd7044mgxzd7jn','create','editorial_board_member','any','draft','',1737283107526,1737283107526);
INSERT INTO AuthorPermission VALUES('cm63hi8xy00be7044ivs24ht6','update','editorial_board_member','any','draft','',1737283107526,1737283107526);
INSERT INTO AuthorPermission VALUES('cm63hi8xy00bf7044f21gq50k','delete','editorial_board_member','any','draft','',1737283107527,1737283107527);
INSERT INTO AuthorPermission VALUES('cm63hi8xz00bg70446i7kvqcq','publish','editorial_board_member','any','draft','',1737283107527,1737283107527);
INSERT INTO AuthorPermission VALUES('cm63hi8xz00bh7044i6cxqkbq','retract','editorial_board_member','any','draft','',1737283107528,1737283107528);
INSERT INTO AuthorPermission VALUES('cm63hi8y000bi7044aiijxjcd','archive','editorial_board_member','any','draft','',1737283107528,1737283107528);
INSERT INTO AuthorPermission VALUES('cm63hi8y000bj70446pwct0sf','restore','editorial_board_member','any','draft','',1737283107529,1737283107529);
INSERT INTO AuthorPermission VALUES('cm63hi8y000bk70445abthlnc','view','editorial_board_member','own','published','',1737283107529,1737283107529);
INSERT INTO AuthorPermission VALUES('cm63hi8y100bl7044qut0vc4n','create','editorial_board_member','own','published','',1737283107529,1737283107529);
INSERT INTO AuthorPermission VALUES('cm63hi8y100bm70446iwlt98a','update','editorial_board_member','own','published','',1737283107530,1737283107530);
INSERT INTO AuthorPermission VALUES('cm63hi8y200bn70440m14ju1x','delete','editorial_board_member','own','published','',1737283107530,1737283107530);
INSERT INTO AuthorPermission VALUES('cm63hi8y200bo7044q3bw01wh','publish','editorial_board_member','own','published','',1737283107531,1737283107531);
INSERT INTO AuthorPermission VALUES('cm63hi8y300bp7044fm7su5t3','retract','editorial_board_member','own','published','',1737283107531,1737283107531);
INSERT INTO AuthorPermission VALUES('cm63hi8y300bq7044jivu2jx8','archive','editorial_board_member','own','published','',1737283107532,1737283107532);
INSERT INTO AuthorPermission VALUES('cm63hi8y400br7044x45xmpob','restore','editorial_board_member','own','published','',1737283107533,1737283107533);
INSERT INTO AuthorPermission VALUES('cm63hi8y500bs7044zmb09fui','view','editorial_board_member','any','published','',1737283107533,1737283107533);
INSERT INTO AuthorPermission VALUES('cm63hi8y500bt7044yq3zivxf','create','editorial_board_member','any','published','',1737283107534,1737283107534);
INSERT INTO AuthorPermission VALUES('cm63hi8y600bu7044t4i9m9zo','update','editorial_board_member','any','published','',1737283107534,1737283107534);
INSERT INTO AuthorPermission VALUES('cm63hi8y600bv70446g2r0213','delete','editorial_board_member','any','published','',1737283107535,1737283107535);
INSERT INTO AuthorPermission VALUES('cm63hi8y700bw7044lb7mwjj1','publish','editorial_board_member','any','published','',1737283107535,1737283107535);
INSERT INTO AuthorPermission VALUES('cm63hi8y700bx7044iyrlhmcd','retract','editorial_board_member','any','published','',1737283107536,1737283107536);
INSERT INTO AuthorPermission VALUES('cm63hi8y800by7044dtbbk72d','archive','editorial_board_member','any','published','',1737283107536,1737283107536);
INSERT INTO AuthorPermission VALUES('cm63hi8y800bz7044836i26qy','restore','editorial_board_member','any','published','',1737283107537,1737283107537);
INSERT INTO AuthorPermission VALUES('cm63hi8y900c070447gbo9026','view','editorial_board_member','own','archived','',1737283107537,1737283107537);
INSERT INTO AuthorPermission VALUES('cm63hi8y900c17044ywc6izfy','create','editorial_board_member','own','archived','',1737283107538,1737283107538);
INSERT INTO AuthorPermission VALUES('cm63hi8y900c270444hesf11z','update','editorial_board_member','own','archived','',1737283107538,1737283107538);
INSERT INTO AuthorPermission VALUES('cm63hi8ya00c37044r7xk3gh4','delete','editorial_board_member','own','archived','',1737283107539,1737283107539);
INSERT INTO AuthorPermission VALUES('cm63hi8yb00c47044bv1nyrdv','publish','editorial_board_member','own','archived','',1737283107539,1737283107539);
INSERT INTO AuthorPermission VALUES('cm63hi8yb00c57044t7b1zcor','retract','editorial_board_member','own','archived','',1737283107540,1737283107540);
INSERT INTO AuthorPermission VALUES('cm63hi8yc00c67044stmbfevu','archive','editorial_board_member','own','archived','',1737283107541,1737283107541);
INSERT INTO AuthorPermission VALUES('cm63hi8yd00c770449scthpzv','restore','editorial_board_member','own','archived','',1737283107541,1737283107541);
INSERT INTO AuthorPermission VALUES('cm63hi8yd00c870448ol66d6n','view','editorial_board_member','any','archived','',1737283107542,1737283107542);
INSERT INTO AuthorPermission VALUES('cm63hi8ye00c97044aglkseuh','create','editorial_board_member','any','archived','',1737283107543,1737283107543);
INSERT INTO AuthorPermission VALUES('cm63hi8yf00ca70445kfc92rm','update','editorial_board_member','any','archived','',1737283107544,1737283107544);
INSERT INTO AuthorPermission VALUES('cm63hi8yg00cb70448ovcu123','delete','editorial_board_member','any','archived','',1737283107544,1737283107544);
INSERT INTO AuthorPermission VALUES('cm63hi8yg00cc7044pqscfuq7','publish','editorial_board_member','any','archived','',1737283107545,1737283107545);
INSERT INTO AuthorPermission VALUES('cm63hi8yg00cd7044mapms04g','retract','editorial_board_member','any','archived','',1737283107545,1737283107545);
INSERT INTO AuthorPermission VALUES('cm63hi8yh00ce7044ubhl3o5k','archive','editorial_board_member','any','archived','',1737283107545,1737283107545);
INSERT INTO AuthorPermission VALUES('cm63hi8yh00cf7044ltgj5y1y','restore','editorial_board_member','any','archived','',1737283107546,1737283107546);

INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8qr000h7044uacjbw56','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8qt000j7044l8vh0fv4','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8qs000i7044yy0zao7h','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8qq000g70447vzzg5e0','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8ro001t70449jobbebc','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8rp001v7044bhupc3bv','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8rp001u7044zvnix0c0','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8ro001s7044h96tgsjf','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8sy00357044xw3s2sft','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8sz003770444y84mprq','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8sy003670442sgs6inm','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8sx00347044p1nc5gzb','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8ts004h704437wa4x1k','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8tt004j7044d3aom9ye','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8tt004i7044jr2i2l2h','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8ts004g70442tdv72o9','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8ui005t70446ikq9iqt','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8uj005v704406k4asvm','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8ui005u7044ykab34df','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8uh005s7044fx7cqz30','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8va00757044aa0x3wu4','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8vb007770446cd21gib','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8va00767044d9dez39g','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8v900747044zav78mxu','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8vz008h70447a6fjobs','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8w1008j7044temru1up','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8w0008i7044lqx1zmkp','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8vz008g70445apvqdko','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8qr000h7044uacjbw56','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8qt000j7044l8vh0fv4','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8qu000k70440ora43on','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8qs000i7044yy0zao7h','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8qq000g70447vzzg5e0','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8r500127044gnetqeh3','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8r400117044uzqwnlh6','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8r3000y7044hjfoccn9','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8r2000w7044cw8uv3qc','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8ro001t70449jobbebc','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8rp001v7044bhupc3bv','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8rr001w7044729xru1p','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8rp001u7044zvnix0c0','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8ro001s7044h96tgsjf','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8s6002e7044bnsg6znb','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8s5002d7044us6xp69y','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8s3002a7044ejgwcjq8','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8s100287044jtgmsnbo','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8sy00357044xw3s2sft','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8sz003770444y84mprq','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8t0003870443hjtqxjb','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8sy003670442sgs6inm','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8sx00347044p1nc5gzb','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8tc003q7044pn2ba39z','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8tb003p7044vl473ozf','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8ta003m7044x4zh3o2m','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8t8003k7044gc84rwgs','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8ts004h704437wa4x1k','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8tt004j7044d3aom9ye','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8tu004k7044hk8zwrno','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8tt004i7044jr2i2l2h','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8ts004g70442tdv72o9','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8u300527044lrlw3z9c','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8u200517044stg0dnt3','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8u1004y7044gyux931d','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8u0004w70446kvn69i5','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8ui005t70446ikq9iqt','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8uj005v704406k4asvm','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8uj005w7044mu7kr6w7','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8ui005u7044ykab34df','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8uh005s7044fx7cqz30','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8ut006e7044ox4t0g6p','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8us006d7044mr8qhax9','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8ur006a7044e6mkv8oc','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8up00687044r61zbqt1','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8va00757044aa0x3wu4','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8vb007770446cd21gib','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8vb007870440fqws1pv','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8va00767044d9dez39g','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8v900747044zav78mxu','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8vk007q7044momiiied','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8vk007p7044xbsrb0op','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8vi007m70444f5o9wc3','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8vh007k70442a6krv7u','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8vz008h70447a6fjobs','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8w1008j7044temru1up','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8w1008k7044qe745780','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8w0008i7044lqx1zmkp','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8vz008g70445apvqdko','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8wj00927044o5h7gm0j','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8wi00917044tj8e5h9n','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8wh008y7044tzqb7e3r','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8we008w70443xg95j7p','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8qx000p7044koxqteri','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8qz000r7044tl4rryf7','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8qz000s7044pjx85v6e','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8qy000q7044j6lsr3oj','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8qx000o7044v78ugh6t','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8ra001a7044hco292qc','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8r7001570444ewtyb86','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8ra00197044thfknpym','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8r8001670448nz37d0k','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8r700147044hk11bsg6','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8rl001n70444ktm1y9e','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8rn001r7044a1gn7v4d','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8rk001m7044p9xl9wdo','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8rh001k7044n351dzrl','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8rw00217044l2g8qz96','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8ry00237044wq9tvqnk','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8rz00247044kc75kysl','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8rx00227044550dk1jo','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8rw00207044uqo1ovcv','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8sa002m70444ipmi7ci','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8s7002h7044n4kxbdht','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8s9002l7044829mfovp','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8s8002i7044lbm7ek2x','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8s7002g7044hicoxsg3','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8sv002z7044wpk9k78z','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8sx00337044ldjbas1g','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8sv002y7044cmy7wm7u','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8su002w70449spwi7os','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8t4003d7044z0zpb4ap','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8t6003f7044jv4p9gvz','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8t6003g7044a7rij2bn','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8t5003e7044gf7tsz2l','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8t4003c7044jbyic5vs','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8th003y7044xti70oz9','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8te003t7044mdvznkxs','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8tg003x704482h7d1wb','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8tf003u7044z5exkxep','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8td003s7044xw3qljs4','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8tn004b70442i8t6jbk','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8tr004f7044os1hhxzg','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8tm004a7044y9ym13ns','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8tl00487044m3t7nmeq','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8tw004p7044rx5fl72p','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8tx004r7044ickv98vd','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8ty004s7044vcqab0vo','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8tx004q7044wl5cwqip','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8tw004o7044vu044lv2','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8u6005a7044px0m7eiw','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8u4005570443flj3ewo','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8u600597044t0w2nzew','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8u4005670446u8q7qcu','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8u400547044vpttvokt','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8ue005n7044mwko78vq','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8uh005r704488imb99f','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8ue005m7044iurtl9vg','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8uc005k70448fbz0sz4','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8ul00617044dsfwy3bv','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8um00637044wwtvawoz','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8un00647044alyrubs8','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8um00627044fa7dr75h','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8ul00607044czj9yj3b','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8uy006m7044591rcqae','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8uv006h7044tu63j5km','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8uy006l7044ml7miomw','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8uw006i7044fvf7c4t9','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8uu006g7044at49ftey','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8v7006z7044ti75h03s','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8v9007370446yu4hl7n','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8v7006y7044h92wvwj3','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8v6006w7044smslsbna','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8ve007d7044l6y4hyn3','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8vf007f704409n6odia','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8vf007g7044fo9xo71o','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8ve007e7044mivyt97b','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8vd007c7044p55ab8at','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8vp007y7044zomph6uv','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8vl007t7044smydmsw7','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8vo007x7044vno6mfzz','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8vm007u704458v0oltj','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8vl007s7044xzy61aab','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8vw008b7044ar3gfz9o','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8vy008f7044tuqjhhwa','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8vw008a7044y86yqzzh','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8vv00887044vbzodkcz','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8w5008p7044g0y8e6tn','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8w8008r7044kf639s0s','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8w9008s7044pbs5r6za','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8w7008q7044hklkbj9v','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8w4008o7044znwj16e3','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8wq009a7044rkufjkgr','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8wm00957044ekghivsz','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8wp009970445u3a8c79','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8wm00967044aan6f5oa','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8wl009470447agyomg8','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8wx009n70444mmgvvbf','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8wy009r7044mt65qjna','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8ww009m7044q8asy5yq','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8wv009k7044jxsrnc48','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8xe00ah704469z1yrag','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8xf00aj7044pyu7d7lq','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8xe00ai7044i1v68kqi','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8xd00ag7044ql1wexdb','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8y500bt7044yq3zivxf','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8y600bv70446g2r0213','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8y600bu7044t4i9m9zo','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm63hi8y500bs7044zmb09fui','cm63hi8z800cl7044kr38q54w');
PRAGMA foreign_keys=ON;