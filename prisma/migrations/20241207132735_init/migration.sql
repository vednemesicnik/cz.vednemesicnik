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
CREATE UNIQUE INDEX "AuthorPermission_action_entity_access_key" ON "AuthorPermission"("action", "entity", "access");

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
INSERT INTO User VALUES('cm4e7eq99004u70zagyybng2c','spolek@vednemesicnik.cz','spolek@vednemesicnik.cz','Vedneměsíčník, z. s.',1733577710445,1733577710445,'cm4e7eq6j004q70zawwgb6sle','cm4e7eq99004v70zabxtu4bqq');
INSERT INTO Password VALUES('$2a$10$JA7yCwiLoRJmASsNtDpDY.l1Ffvfo27FcmiPwEzCvmM0EGdxW.syy','cm4e7eq99004u70zagyybng2c');

INSERT INTO UserRole VALUES('cm4e7eq6d004o70zabiqqbhzf','user','',1733577710342,1733577710342);
INSERT INTO UserRole VALUES('cm4e7eq6g004p70zaq7jdt16k','administrator','',1733577710345,1733577710345);
INSERT INTO UserRole VALUES('cm4e7eq6j004q70zawwgb6sle','owner','',1733577710348,1733577710348);

INSERT INTO UserPermission VALUES('cm4e7eq37000070zan89kqjg9','view','user','own','',1733577710227,1733577710227);
INSERT INTO UserPermission VALUES('cm4e7eq38000170zacrl01jy6','view','user','any','',1733577710228,1733577710228);
INSERT INTO UserPermission VALUES('cm4e7eq39000270zaee83bl7c','create','user','own','',1733577710229,1733577710229);
INSERT INTO UserPermission VALUES('cm4e7eq39000370zaxlwxld9d','create','user','any','',1733577710230,1733577710230);
INSERT INTO UserPermission VALUES('cm4e7eq3a000470za6y66qcfu','update','user','own','',1733577710230,1733577710230);
INSERT INTO UserPermission VALUES('cm4e7eq3b000570zaqmlhvils','update','user','any','',1733577710231,1733577710231);
INSERT INTO UserPermission VALUES('cm4e7eq3b000670zaqd9lp7uw','delete','user','own','',1733577710232,1733577710232);
INSERT INTO UserPermission VALUES('cm4e7eq3c000770za9rg5qw07','delete','user','any','',1733577710233,1733577710233);
INSERT INTO UserPermission VALUES('cm4e7eq3d000870za9e4iv2on','assign_role_owner','user','own','',1733577710233,1733577710233);
INSERT INTO UserPermission VALUES('cm4e7eq3e000970za6ibkwxfy','assign_role_owner','user','any','',1733577710234,1733577710234);
INSERT INTO UserPermission VALUES('cm4e7eq3e000a70za44wulz29','assign_role_administrator','user','own','',1733577710235,1733577710235);
INSERT INTO UserPermission VALUES('cm4e7eq3f000b70zatze27irk','assign_role_administrator','user','any','',1733577710235,1733577710235);
INSERT INTO UserPermission VALUES('cm4e7eq3g000c70zaykuaxbdg','assign_role_user','user','own','',1733577710236,1733577710236);
INSERT INTO UserPermission VALUES('cm4e7eq3g000d70zavx9x90qu','assign_role_user','user','any','',1733577710237,1733577710237);
INSERT INTO UserPermission VALUES('cm4e7eq3h000e70za9ia8coww','assign_role_editor','user','own','',1733577710237,1733577710237);
INSERT INTO UserPermission VALUES('cm4e7eq3h000f70zafgokce4l','assign_role_editor','user','any','',1733577710238,1733577710238);
INSERT INTO UserPermission VALUES('cm4e7eq3i000g70zaiuztrdf8','assign_role_author','user','own','',1733577710238,1733577710238);
INSERT INTO UserPermission VALUES('cm4e7eq3i000h70zadar6e2fm','assign_role_author','user','any','',1733577710239,1733577710239);
INSERT INTO UserPermission VALUES('cm4e7eq3j000i70za0pud7wld','assign_role_contributor','user','own','',1733577710239,1733577710239);
INSERT INTO UserPermission VALUES('cm4e7eq3k000j70zahgn01k73','assign_role_contributor','user','any','',1733577710240,1733577710240);
INSERT INTO UserPermission VALUES('cm4e7eq3k000k70zax7vq3cr6','view','author','own','',1733577710241,1733577710241);
INSERT INTO UserPermission VALUES('cm4e7eq3l000l70zajnb8r40q','view','author','any','',1733577710241,1733577710241);
INSERT INTO UserPermission VALUES('cm4e7eq3l000m70zafv1eqzpe','create','author','own','',1733577710242,1733577710242);
INSERT INTO UserPermission VALUES('cm4e7eq3m000n70za4wbgg5kp','create','author','any','',1733577710242,1733577710242);
INSERT INTO UserPermission VALUES('cm4e7eq3m000o70zajvaupzdw','update','author','own','',1733577710243,1733577710243);
INSERT INTO UserPermission VALUES('cm4e7eq3n000p70zao3onssvo','update','author','any','',1733577710243,1733577710243);
INSERT INTO UserPermission VALUES('cm4e7eq3n000q70zakpel4w86','delete','author','own','',1733577710244,1733577710244);
INSERT INTO UserPermission VALUES('cm4e7eq3o000r70zaj4t82tkn','delete','author','any','',1733577710244,1733577710244);
INSERT INTO UserPermission VALUES('cm4e7eq3o000s70zak1jt8vjb','assign_role_owner','author','own','',1733577710245,1733577710245);
INSERT INTO UserPermission VALUES('cm4e7eq3p000t70zaybd6ln6h','assign_role_owner','author','any','',1733577710245,1733577710245);
INSERT INTO UserPermission VALUES('cm4e7eq3p000u70zat68b9utf','assign_role_administrator','author','own','',1733577710246,1733577710246);
INSERT INTO UserPermission VALUES('cm4e7eq3q000v70zam78i51w1','assign_role_administrator','author','any','',1733577710246,1733577710246);
INSERT INTO UserPermission VALUES('cm4e7eq3r000w70zaumkkjuzp','assign_role_user','author','own','',1733577710247,1733577710247);
INSERT INTO UserPermission VALUES('cm4e7eq3r000x70zagxkl6nld','assign_role_user','author','any','',1733577710248,1733577710248);
INSERT INTO UserPermission VALUES('cm4e7eq3s000y70zaxsxt4kro','assign_role_editor','author','own','',1733577710248,1733577710248);
INSERT INTO UserPermission VALUES('cm4e7eq3s000z70za5dk26yti','assign_role_editor','author','any','',1733577710249,1733577710249);
INSERT INTO UserPermission VALUES('cm4e7eq3t001070za0g42gti8','assign_role_author','author','own','',1733577710249,1733577710249);
INSERT INTO UserPermission VALUES('cm4e7eq3t001170zaj0z05wiv','assign_role_author','author','any','',1733577710250,1733577710250);
INSERT INTO UserPermission VALUES('cm4e7eq3u001270zatdnu7hl5','assign_role_contributor','author','own','',1733577710250,1733577710250);
INSERT INTO UserPermission VALUES('cm4e7eq3u001370zan7h1x1zy','assign_role_contributor','author','any','',1733577710251,1733577710251);

INSERT INTO Author VALUES('cm4e7eq99004v70zabxtu4bqq','Vedneměsíčník, z. s.',NULL,1733577710445,1733577710445,'cm4e7eq6w004t70zae526u26m');

INSERT INTO AuthorRole VALUES('cm4e7eq6n004r70zalhgk0dvs','contributor','',1733577710351,1733577710351);
INSERT INTO AuthorRole VALUES('cm4e7eq6r004s70zanq09nhn7','author','',1733577710355,1733577710355);
INSERT INTO AuthorRole VALUES('cm4e7eq6w004t70zae526u26m','editor','',1733577710361,1733577710361);

INSERT INTO AuthorPermission VALUES('cm4e7eq3v001470za5vuvq2w8','view','article','own','',1733577710252,1733577710252);
INSERT INTO AuthorPermission VALUES('cm4e7eq3w001570za462kkony','view','article','any','',1733577710253,1733577710253);
INSERT INTO AuthorPermission VALUES('cm4e7eq3x001670za0764qhsb','create','article','own','',1733577710253,1733577710253);
INSERT INTO AuthorPermission VALUES('cm4e7eq3y001770za9pf027by','create','article','any','',1733577710255,1733577710255);
INSERT INTO AuthorPermission VALUES('cm4e7eq3z001870za2gl4s3re','update','article','own','',1733577710255,1733577710255);
INSERT INTO AuthorPermission VALUES('cm4e7eq3z001970za4co0qb5d','update','article','any','',1733577710256,1733577710256);
INSERT INTO AuthorPermission VALUES('cm4e7eq40001a70za1ib90x4f','delete','article','own','',1733577710257,1733577710257);
INSERT INTO AuthorPermission VALUES('cm4e7eq41001b70zatnf8wl3j','delete','article','any','',1733577710257,1733577710257);
INSERT INTO AuthorPermission VALUES('cm4e7eq42001c70za0yb3koyl','publish','article','own','',1733577710258,1733577710258);
INSERT INTO AuthorPermission VALUES('cm4e7eq43001d70za2999vrri','publish','article','any','',1733577710259,1733577710259);
INSERT INTO AuthorPermission VALUES('cm4e7eq43001e70zawe620hbk','retract','article','own','',1733577710260,1733577710260);
INSERT INTO AuthorPermission VALUES('cm4e7eq44001f70zah4q0ipdm','retract','article','any','',1733577710260,1733577710260);
INSERT INTO AuthorPermission VALUES('cm4e7eq45001g70zaxfbjuskd','archive','article','own','',1733577710261,1733577710261);
INSERT INTO AuthorPermission VALUES('cm4e7eq45001h70za2fcpi5j9','archive','article','any','',1733577710262,1733577710262);
INSERT INTO AuthorPermission VALUES('cm4e7eq46001i70za5tt88k47','restore','article','own','',1733577710262,1733577710262);
INSERT INTO AuthorPermission VALUES('cm4e7eq46001j70za1plglpxn','restore','article','any','',1733577710263,1733577710263);
INSERT INTO AuthorPermission VALUES('cm4e7eq47001k70za22kzwpcf','view','article_category','own','',1733577710264,1733577710264);
INSERT INTO AuthorPermission VALUES('cm4e7eq48001l70za1tfeqpix','view','article_category','any','',1733577710264,1733577710264);
INSERT INTO AuthorPermission VALUES('cm4e7eq48001m70za9ygqnrv0','create','article_category','own','',1733577710265,1733577710265);
INSERT INTO AuthorPermission VALUES('cm4e7eq49001n70zatc0wpqls','create','article_category','any','',1733577710265,1733577710265);
INSERT INTO AuthorPermission VALUES('cm4e7eq49001o70zaxrp5etyc','update','article_category','own','',1733577710266,1733577710266);
INSERT INTO AuthorPermission VALUES('cm4e7eq4a001p70zacu586fuu','update','article_category','any','',1733577710267,1733577710267);
INSERT INTO AuthorPermission VALUES('cm4e7eq4b001q70zadm90x1sp','delete','article_category','own','',1733577710267,1733577710267);
INSERT INTO AuthorPermission VALUES('cm4e7eq4b001r70zak9ikykxt','delete','article_category','any','',1733577710268,1733577710268);
INSERT INTO AuthorPermission VALUES('cm4e7eq4c001s70zam2uy1hu9','publish','article_category','own','',1733577710268,1733577710268);
INSERT INTO AuthorPermission VALUES('cm4e7eq4c001t70zafylujzbn','publish','article_category','any','',1733577710269,1733577710269);
INSERT INTO AuthorPermission VALUES('cm4e7eq4d001u70za8y69rfpe','retract','article_category','own','',1733577710270,1733577710270);
INSERT INTO AuthorPermission VALUES('cm4e7eq4e001v70za5kkn4xg9','retract','article_category','any','',1733577710270,1733577710270);
INSERT INTO AuthorPermission VALUES('cm4e7eq4f001w70zacmv476ls','archive','article_category','own','',1733577710271,1733577710271);
INSERT INTO AuthorPermission VALUES('cm4e7eq4f001x70zat49mrsgv','archive','article_category','any','',1733577710272,1733577710272);
INSERT INTO AuthorPermission VALUES('cm4e7eq4g001y70za9kvf6c4l','restore','article_category','own','',1733577710272,1733577710272);
INSERT INTO AuthorPermission VALUES('cm4e7eq4g001z70zalsbtvuvm','restore','article_category','any','',1733577710273,1733577710273);
INSERT INTO AuthorPermission VALUES('cm4e7eq4h002070za8m5b81ao','view','podcast','own','',1733577710273,1733577710273);
INSERT INTO AuthorPermission VALUES('cm4e7eq4i002170zapwrs7l6d','view','podcast','any','',1733577710274,1733577710274);
INSERT INTO AuthorPermission VALUES('cm4e7eq4k002270zav8asy3wg','create','podcast','own','',1733577710276,1733577710276);
INSERT INTO AuthorPermission VALUES('cm4e7eq4l002370zarczvm5vf','create','podcast','any','',1733577710277,1733577710277);
INSERT INTO AuthorPermission VALUES('cm4e7eq4n002470zanbnsfg4r','update','podcast','own','',1733577710279,1733577710279);
INSERT INTO AuthorPermission VALUES('cm4e7eq4n002570zasep6y52i','update','podcast','any','',1733577710280,1733577710280);
INSERT INTO AuthorPermission VALUES('cm4e7eq4o002670zar0d448ck','delete','podcast','own','',1733577710281,1733577710281);
INSERT INTO AuthorPermission VALUES('cm4e7eq4p002770zafjnog0vm','delete','podcast','any','',1733577710281,1733577710281);
INSERT INTO AuthorPermission VALUES('cm4e7eq4q002870zafwmu8yjb','publish','podcast','own','',1733577710282,1733577710282);
INSERT INTO AuthorPermission VALUES('cm4e7eq4r002970zay62pngt6','publish','podcast','any','',1733577710283,1733577710283);
INSERT INTO AuthorPermission VALUES('cm4e7eq4s002a70za3bcho9w4','retract','podcast','own','',1733577710284,1733577710284);
INSERT INTO AuthorPermission VALUES('cm4e7eq4s002b70zaso6llz4m','retract','podcast','any','',1733577710285,1733577710285);
INSERT INTO AuthorPermission VALUES('cm4e7eq4t002c70zad580w4nf','archive','podcast','own','',1733577710286,1733577710286);
INSERT INTO AuthorPermission VALUES('cm4e7eq4u002d70zad475j50s','archive','podcast','any','',1733577710287,1733577710287);
INSERT INTO AuthorPermission VALUES('cm4e7eq4v002e70zatqwpwe5q','restore','podcast','own','',1733577710288,1733577710288);
INSERT INTO AuthorPermission VALUES('cm4e7eq4w002f70zataa23jv2','restore','podcast','any','',1733577710289,1733577710289);
INSERT INTO AuthorPermission VALUES('cm4e7eq4x002g70zao0l487za','view','podcast_episode','own','',1733577710290,1733577710290);
INSERT INTO AuthorPermission VALUES('cm4e7eq4y002h70zaptp7nnl5','view','podcast_episode','any','',1733577710290,1733577710290);
INSERT INTO AuthorPermission VALUES('cm4e7eq4y002i70zavmh3yvpm','create','podcast_episode','own','',1733577710291,1733577710291);
INSERT INTO AuthorPermission VALUES('cm4e7eq4z002j70za8sfrd3zz','create','podcast_episode','any','',1733577710291,1733577710291);
INSERT INTO AuthorPermission VALUES('cm4e7eq50002k70zakmn0j7r6','update','podcast_episode','own','',1733577710292,1733577710292);
INSERT INTO AuthorPermission VALUES('cm4e7eq50002l70zacpbrngag','update','podcast_episode','any','',1733577710293,1733577710293);
INSERT INTO AuthorPermission VALUES('cm4e7eq51002m70zawi9w88lb','delete','podcast_episode','own','',1733577710293,1733577710293);
INSERT INTO AuthorPermission VALUES('cm4e7eq51002n70za6mq2bqx1','delete','podcast_episode','any','',1733577710294,1733577710294);
INSERT INTO AuthorPermission VALUES('cm4e7eq52002o70zag7ce23d9','publish','podcast_episode','own','',1733577710294,1733577710294);
INSERT INTO AuthorPermission VALUES('cm4e7eq53002p70zazlah3u66','publish','podcast_episode','any','',1733577710295,1733577710295);
INSERT INTO AuthorPermission VALUES('cm4e7eq54002q70za67jxmkpg','retract','podcast_episode','own','',1733577710296,1733577710296);
INSERT INTO AuthorPermission VALUES('cm4e7eq54002r70za58fr7ok5','retract','podcast_episode','any','',1733577710297,1733577710297);
INSERT INTO AuthorPermission VALUES('cm4e7eq55002s70zawasiw7ok','archive','podcast_episode','own','',1733577710297,1733577710297);
INSERT INTO AuthorPermission VALUES('cm4e7eq56002t70za9kc3lav7','archive','podcast_episode','any','',1733577710298,1733577710298);
INSERT INTO AuthorPermission VALUES('cm4e7eq57002u70zah00pf2ch','restore','podcast_episode','own','',1733577710299,1733577710299);
INSERT INTO AuthorPermission VALUES('cm4e7eq57002v70zav5wkw6iy','restore','podcast_episode','any','',1733577710300,1733577710300);
INSERT INTO AuthorPermission VALUES('cm4e7eq58002w70zawf1ei64q','view','podcast_episode_link','own','',1733577710300,1733577710300);
INSERT INTO AuthorPermission VALUES('cm4e7eq58002x70zao32349pq','view','podcast_episode_link','any','',1733577710301,1733577710301);
INSERT INTO AuthorPermission VALUES('cm4e7eq59002y70za197gpq5y','create','podcast_episode_link','own','',1733577710301,1733577710301);
INSERT INTO AuthorPermission VALUES('cm4e7eq59002z70zav8nbx104','create','podcast_episode_link','any','',1733577710302,1733577710302);
INSERT INTO AuthorPermission VALUES('cm4e7eq5a003070zagxl85faf','update','podcast_episode_link','own','',1733577710302,1733577710302);
INSERT INTO AuthorPermission VALUES('cm4e7eq5a003170zar488oam5','update','podcast_episode_link','any','',1733577710303,1733577710303);
INSERT INTO AuthorPermission VALUES('cm4e7eq5b003270zaib1j3bjm','delete','podcast_episode_link','own','',1733577710303,1733577710303);
INSERT INTO AuthorPermission VALUES('cm4e7eq5b003370za8rau43bj','delete','podcast_episode_link','any','',1733577710304,1733577710304);
INSERT INTO AuthorPermission VALUES('cm4e7eq5c003470zaew4v2jda','publish','podcast_episode_link','own','',1733577710305,1733577710305);
INSERT INTO AuthorPermission VALUES('cm4e7eq5d003570zayb512j3l','publish','podcast_episode_link','any','',1733577710305,1733577710305);
INSERT INTO AuthorPermission VALUES('cm4e7eq5d003670za296p1lnj','retract','podcast_episode_link','own','',1733577710306,1733577710306);
INSERT INTO AuthorPermission VALUES('cm4e7eq5e003770za6afbs5lp','retract','podcast_episode_link','any','',1733577710306,1733577710306);
INSERT INTO AuthorPermission VALUES('cm4e7eq5e003870zaru0d78rx','archive','podcast_episode_link','own','',1733577710307,1733577710307);
INSERT INTO AuthorPermission VALUES('cm4e7eq5f003970zanh4fduxz','archive','podcast_episode_link','any','',1733577710307,1733577710307);
INSERT INTO AuthorPermission VALUES('cm4e7eq5f003a70za4ysnvnlv','restore','podcast_episode_link','own','',1733577710308,1733577710308);
INSERT INTO AuthorPermission VALUES('cm4e7eq5g003b70zatc6pu615','restore','podcast_episode_link','any','',1733577710308,1733577710308);
INSERT INTO AuthorPermission VALUES('cm4e7eq5g003c70zan2zg4yps','view','issue','own','',1733577710309,1733577710309);
INSERT INTO AuthorPermission VALUES('cm4e7eq5h003d70za5mrre67b','view','issue','any','',1733577710309,1733577710309);
INSERT INTO AuthorPermission VALUES('cm4e7eq5h003e70zaxk3a8o0b','create','issue','own','',1733577710310,1733577710310);
INSERT INTO AuthorPermission VALUES('cm4e7eq5i003f70zalk9b33fk','create','issue','any','',1733577710310,1733577710310);
INSERT INTO AuthorPermission VALUES('cm4e7eq5j003g70zascbsxjes','update','issue','own','',1733577710311,1733577710311);
INSERT INTO AuthorPermission VALUES('cm4e7eq5j003h70zahclzfb6q','update','issue','any','',1733577710312,1733577710312);
INSERT INTO AuthorPermission VALUES('cm4e7eq5k003i70za05kpxygw','delete','issue','own','',1733577710312,1733577710312);
INSERT INTO AuthorPermission VALUES('cm4e7eq5l003j70zaqp08hrwu','delete','issue','any','',1733577710313,1733577710313);
INSERT INTO AuthorPermission VALUES('cm4e7eq5m003k70zafn2x8pqq','publish','issue','own','',1733577710314,1733577710314);
INSERT INTO AuthorPermission VALUES('cm4e7eq5n003l70zalldrik6r','publish','issue','any','',1733577710315,1733577710315);
INSERT INTO AuthorPermission VALUES('cm4e7eq5n003m70zakbl29nxq','retract','issue','own','',1733577710316,1733577710316);
INSERT INTO AuthorPermission VALUES('cm4e7eq5o003n70za259fcore','retract','issue','any','',1733577710316,1733577710316);
INSERT INTO AuthorPermission VALUES('cm4e7eq5o003o70zarj6zbqrh','archive','issue','own','',1733577710317,1733577710317);
INSERT INTO AuthorPermission VALUES('cm4e7eq5p003p70zag1finac4','archive','issue','any','',1733577710318,1733577710318);
INSERT INTO AuthorPermission VALUES('cm4e7eq5q003q70za7uehb5dt','restore','issue','own','',1733577710318,1733577710318);
INSERT INTO AuthorPermission VALUES('cm4e7eq5q003r70za6okv5lan','restore','issue','any','',1733577710319,1733577710319);
INSERT INTO AuthorPermission VALUES('cm4e7eq5r003s70zarpn05qhf','view','editorial_board_position','own','',1733577710319,1733577710319);
INSERT INTO AuthorPermission VALUES('cm4e7eq5r003t70zaa3xwvm0h','view','editorial_board_position','any','',1733577710320,1733577710320);
INSERT INTO AuthorPermission VALUES('cm4e7eq5s003u70zaz7pu5aai','create','editorial_board_position','own','',1733577710320,1733577710320);
INSERT INTO AuthorPermission VALUES('cm4e7eq5t003v70za38l2yi7c','create','editorial_board_position','any','',1733577710321,1733577710321);
INSERT INTO AuthorPermission VALUES('cm4e7eq5t003w70zathnq119i','update','editorial_board_position','own','',1733577710322,1733577710322);
INSERT INTO AuthorPermission VALUES('cm4e7eq5u003x70zaz1rnyxsx','update','editorial_board_position','any','',1733577710322,1733577710322);
INSERT INTO AuthorPermission VALUES('cm4e7eq5u003y70zah66q1gy4','delete','editorial_board_position','own','',1733577710323,1733577710323);
INSERT INTO AuthorPermission VALUES('cm4e7eq5v003z70zakcc0id21','delete','editorial_board_position','any','',1733577710323,1733577710323);
INSERT INTO AuthorPermission VALUES('cm4e7eq5v004070zaejqd9qr8','publish','editorial_board_position','own','',1733577710324,1733577710324);
INSERT INTO AuthorPermission VALUES('cm4e7eq5w004170zassxdgqm6','publish','editorial_board_position','any','',1733577710325,1733577710325);
INSERT INTO AuthorPermission VALUES('cm4e7eq5x004270zaqduu72r9','retract','editorial_board_position','own','',1733577710325,1733577710325);
INSERT INTO AuthorPermission VALUES('cm4e7eq5x004370za6vuiae29','retract','editorial_board_position','any','',1733577710326,1733577710326);
INSERT INTO AuthorPermission VALUES('cm4e7eq5y004470zasxw79fsp','archive','editorial_board_position','own','',1733577710326,1733577710326);
INSERT INTO AuthorPermission VALUES('cm4e7eq5y004570zabhkgearj','archive','editorial_board_position','any','',1733577710327,1733577710327);
INSERT INTO AuthorPermission VALUES('cm4e7eq5z004670zafi8gk5d7','restore','editorial_board_position','own','',1733577710327,1733577710327);
INSERT INTO AuthorPermission VALUES('cm4e7eq5z004770zadwz5saxc','restore','editorial_board_position','any','',1733577710328,1733577710328);
INSERT INTO AuthorPermission VALUES('cm4e7eq60004870zav3txogew','view','editorial_board_member','own','',1733577710328,1733577710328);
INSERT INTO AuthorPermission VALUES('cm4e7eq60004970zalhcvo8ey','view','editorial_board_member','any','',1733577710329,1733577710329);
INSERT INTO AuthorPermission VALUES('cm4e7eq61004a70zafqlvo7ky','create','editorial_board_member','own','',1733577710329,1733577710329);
INSERT INTO AuthorPermission VALUES('cm4e7eq61004b70za3jmzvlgp','create','editorial_board_member','any','',1733577710330,1733577710330);
INSERT INTO AuthorPermission VALUES('cm4e7eq62004c70zagoufuurt','update','editorial_board_member','own','',1733577710330,1733577710330);
INSERT INTO AuthorPermission VALUES('cm4e7eq62004d70zajx45g7lj','update','editorial_board_member','any','',1733577710331,1733577710331);
INSERT INTO AuthorPermission VALUES('cm4e7eq63004e70za80ysarhm','delete','editorial_board_member','own','',1733577710332,1733577710332);
INSERT INTO AuthorPermission VALUES('cm4e7eq64004f70za4gi3uwog','delete','editorial_board_member','any','',1733577710332,1733577710332);
INSERT INTO AuthorPermission VALUES('cm4e7eq65004g70zanshu0yd9','publish','editorial_board_member','own','',1733577710333,1733577710333);
INSERT INTO AuthorPermission VALUES('cm4e7eq65004h70zat19dtwh8','publish','editorial_board_member','any','',1733577710334,1733577710334);
INSERT INTO AuthorPermission VALUES('cm4e7eq68004i70zasbetnlmp','retract','editorial_board_member','own','',1733577710336,1733577710336);
INSERT INTO AuthorPermission VALUES('cm4e7eq68004j70zac896nn1x','retract','editorial_board_member','any','',1733577710337,1733577710337);
INSERT INTO AuthorPermission VALUES('cm4e7eq69004k70za9vhperkr','archive','editorial_board_member','own','',1733577710338,1733577710338);
INSERT INTO AuthorPermission VALUES('cm4e7eq6a004l70za1wrvl7do','archive','editorial_board_member','any','',1733577710338,1733577710338);
INSERT INTO AuthorPermission VALUES('cm4e7eq6a004m70za74xwk7cn','restore','editorial_board_member','own','',1733577710339,1733577710339);
INSERT INTO AuthorPermission VALUES('cm4e7eq6b004n70zacmuvq6b1','restore','editorial_board_member','any','',1733577710339,1733577710339);

INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3a000470za6y66qcfu','cm4e7eq6d004o70zabiqqbhzf');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq37000070zan89kqjg9','cm4e7eq6d004o70zabiqqbhzf');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3m000o70zajvaupzdw','cm4e7eq6d004o70zabiqqbhzf');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3k000k70zax7vq3cr6','cm4e7eq6d004o70zabiqqbhzf');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3e000a70za44wulz29','cm4e7eq6g004p70zaq7jdt16k');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3g000c70zaykuaxbdg','cm4e7eq6g004p70zaq7jdt16k');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq39000270zaee83bl7c','cm4e7eq6g004p70zaq7jdt16k');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3b000670zaqd9lp7uw','cm4e7eq6g004p70zaq7jdt16k');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3a000470za6y66qcfu','cm4e7eq6g004p70zaq7jdt16k');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq37000070zan89kqjg9','cm4e7eq6g004p70zaq7jdt16k');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3f000b70zatze27irk','cm4e7eq6g004p70zaq7jdt16k');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3g000d70zavx9x90qu','cm4e7eq6g004p70zaq7jdt16k');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq39000370zaxlwxld9d','cm4e7eq6g004p70zaq7jdt16k');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3c000770za9rg5qw07','cm4e7eq6g004p70zaq7jdt16k');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3b000570zaqmlhvils','cm4e7eq6g004p70zaq7jdt16k');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq38000170zacrl01jy6','cm4e7eq6g004p70zaq7jdt16k');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3t001070za0g42gti8','cm4e7eq6g004p70zaq7jdt16k');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3u001270zatdnu7hl5','cm4e7eq6g004p70zaq7jdt16k');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3s000y70zaxsxt4kro','cm4e7eq6g004p70zaq7jdt16k');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3l000m70zafv1eqzpe','cm4e7eq6g004p70zaq7jdt16k');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3n000q70zakpel4w86','cm4e7eq6g004p70zaq7jdt16k');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3m000o70zajvaupzdw','cm4e7eq6g004p70zaq7jdt16k');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3k000k70zax7vq3cr6','cm4e7eq6g004p70zaq7jdt16k');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3t001170zaj0z05wiv','cm4e7eq6g004p70zaq7jdt16k');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3u001370zan7h1x1zy','cm4e7eq6g004p70zaq7jdt16k');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3s000z70za5dk26yti','cm4e7eq6g004p70zaq7jdt16k');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3m000n70za4wbgg5kp','cm4e7eq6g004p70zaq7jdt16k');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3o000r70zaj4t82tkn','cm4e7eq6g004p70zaq7jdt16k');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3n000p70zao3onssvo','cm4e7eq6g004p70zaq7jdt16k');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3l000l70zajnb8r40q','cm4e7eq6g004p70zaq7jdt16k');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3e000a70za44wulz29','cm4e7eq6j004q70zawwgb6sle');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3d000870za9e4iv2on','cm4e7eq6j004q70zawwgb6sle');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3g000c70zaykuaxbdg','cm4e7eq6j004q70zawwgb6sle');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq39000270zaee83bl7c','cm4e7eq6j004q70zawwgb6sle');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3b000670zaqd9lp7uw','cm4e7eq6j004q70zawwgb6sle');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3a000470za6y66qcfu','cm4e7eq6j004q70zawwgb6sle');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq37000070zan89kqjg9','cm4e7eq6j004q70zawwgb6sle');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3f000b70zatze27irk','cm4e7eq6j004q70zawwgb6sle');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3e000970za6ibkwxfy','cm4e7eq6j004q70zawwgb6sle');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3g000d70zavx9x90qu','cm4e7eq6j004q70zawwgb6sle');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq39000370zaxlwxld9d','cm4e7eq6j004q70zawwgb6sle');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3c000770za9rg5qw07','cm4e7eq6j004q70zawwgb6sle');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3b000570zaqmlhvils','cm4e7eq6j004q70zawwgb6sle');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq38000170zacrl01jy6','cm4e7eq6j004q70zawwgb6sle');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3t001070za0g42gti8','cm4e7eq6j004q70zawwgb6sle');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3u001270zatdnu7hl5','cm4e7eq6j004q70zawwgb6sle');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3s000y70zaxsxt4kro','cm4e7eq6j004q70zawwgb6sle');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3l000m70zafv1eqzpe','cm4e7eq6j004q70zawwgb6sle');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3n000q70zakpel4w86','cm4e7eq6j004q70zawwgb6sle');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3m000o70zajvaupzdw','cm4e7eq6j004q70zawwgb6sle');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3k000k70zax7vq3cr6','cm4e7eq6j004q70zawwgb6sle');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3t001170zaj0z05wiv','cm4e7eq6j004q70zawwgb6sle');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3u001370zan7h1x1zy','cm4e7eq6j004q70zawwgb6sle');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3s000z70za5dk26yti','cm4e7eq6j004q70zawwgb6sle');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3m000n70za4wbgg5kp','cm4e7eq6j004q70zawwgb6sle');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3o000r70zaj4t82tkn','cm4e7eq6j004q70zawwgb6sle');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3n000p70zao3onssvo','cm4e7eq6j004q70zawwgb6sle');
INSERT INTO _UserPermissionToUserRole VALUES('cm4e7eq3l000l70zajnb8r40q','cm4e7eq6j004q70zawwgb6sle');

INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq3x001670za0764qhsb','cm4e7eq6n004r70zalhgk0dvs');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq40001a70za1ib90x4f','cm4e7eq6n004r70zalhgk0dvs');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq3z001870za2gl4s3re','cm4e7eq6n004r70zalhgk0dvs');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq3v001470za5vuvq2w8','cm4e7eq6n004r70zalhgk0dvs');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq48001m70za9ygqnrv0','cm4e7eq6n004r70zalhgk0dvs');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq4b001q70zadm90x1sp','cm4e7eq6n004r70zalhgk0dvs');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq49001o70zaxrp5etyc','cm4e7eq6n004r70zalhgk0dvs');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq47001k70za22kzwpcf','cm4e7eq6n004r70zalhgk0dvs');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq4k002270zav8asy3wg','cm4e7eq6n004r70zalhgk0dvs');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq4o002670zar0d448ck','cm4e7eq6n004r70zalhgk0dvs');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq4n002470zanbnsfg4r','cm4e7eq6n004r70zalhgk0dvs');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq4h002070za8m5b81ao','cm4e7eq6n004r70zalhgk0dvs');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq4y002i70zavmh3yvpm','cm4e7eq6n004r70zalhgk0dvs');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq51002m70zawi9w88lb','cm4e7eq6n004r70zalhgk0dvs');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq50002k70zakmn0j7r6','cm4e7eq6n004r70zalhgk0dvs');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq4x002g70zao0l487za','cm4e7eq6n004r70zalhgk0dvs');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq59002y70za197gpq5y','cm4e7eq6n004r70zalhgk0dvs');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq5b003270zaib1j3bjm','cm4e7eq6n004r70zalhgk0dvs');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq5a003070zagxl85faf','cm4e7eq6n004r70zalhgk0dvs');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq58002w70zawf1ei64q','cm4e7eq6n004r70zalhgk0dvs');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq5h003e70zaxk3a8o0b','cm4e7eq6n004r70zalhgk0dvs');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq5k003i70za05kpxygw','cm4e7eq6n004r70zalhgk0dvs');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq5j003g70zascbsxjes','cm4e7eq6n004r70zalhgk0dvs');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq5g003c70zan2zg4yps','cm4e7eq6n004r70zalhgk0dvs');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq45001g70zaxfbjuskd','cm4e7eq6r004s70zanq09nhn7');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq3x001670za0764qhsb','cm4e7eq6r004s70zanq09nhn7');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq40001a70za1ib90x4f','cm4e7eq6r004s70zanq09nhn7');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq42001c70za0yb3koyl','cm4e7eq6r004s70zanq09nhn7');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq43001e70zawe620hbk','cm4e7eq6r004s70zanq09nhn7');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq3z001870za2gl4s3re','cm4e7eq6r004s70zanq09nhn7');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq3v001470za5vuvq2w8','cm4e7eq6r004s70zanq09nhn7');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq4f001w70zacmv476ls','cm4e7eq6r004s70zanq09nhn7');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq48001m70za9ygqnrv0','cm4e7eq6r004s70zanq09nhn7');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq4b001q70zadm90x1sp','cm4e7eq6r004s70zanq09nhn7');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq4c001s70zam2uy1hu9','cm4e7eq6r004s70zanq09nhn7');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq4d001u70za8y69rfpe','cm4e7eq6r004s70zanq09nhn7');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq49001o70zaxrp5etyc','cm4e7eq6r004s70zanq09nhn7');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq47001k70za22kzwpcf','cm4e7eq6r004s70zanq09nhn7');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq4t002c70zad580w4nf','cm4e7eq6r004s70zanq09nhn7');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq4k002270zav8asy3wg','cm4e7eq6r004s70zanq09nhn7');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq4o002670zar0d448ck','cm4e7eq6r004s70zanq09nhn7');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq4q002870zafwmu8yjb','cm4e7eq6r004s70zanq09nhn7');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq4s002a70za3bcho9w4','cm4e7eq6r004s70zanq09nhn7');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq4n002470zanbnsfg4r','cm4e7eq6r004s70zanq09nhn7');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq4h002070za8m5b81ao','cm4e7eq6r004s70zanq09nhn7');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq55002s70zawasiw7ok','cm4e7eq6r004s70zanq09nhn7');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq4y002i70zavmh3yvpm','cm4e7eq6r004s70zanq09nhn7');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq51002m70zawi9w88lb','cm4e7eq6r004s70zanq09nhn7');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq52002o70zag7ce23d9','cm4e7eq6r004s70zanq09nhn7');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq54002q70za67jxmkpg','cm4e7eq6r004s70zanq09nhn7');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq50002k70zakmn0j7r6','cm4e7eq6r004s70zanq09nhn7');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq4x002g70zao0l487za','cm4e7eq6r004s70zanq09nhn7');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq5e003870zaru0d78rx','cm4e7eq6r004s70zanq09nhn7');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq59002y70za197gpq5y','cm4e7eq6r004s70zanq09nhn7');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq5b003270zaib1j3bjm','cm4e7eq6r004s70zanq09nhn7');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq5c003470zaew4v2jda','cm4e7eq6r004s70zanq09nhn7');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq5d003670za296p1lnj','cm4e7eq6r004s70zanq09nhn7');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq5a003070zagxl85faf','cm4e7eq6r004s70zanq09nhn7');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq58002w70zawf1ei64q','cm4e7eq6r004s70zanq09nhn7');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq5o003o70zarj6zbqrh','cm4e7eq6r004s70zanq09nhn7');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq5h003e70zaxk3a8o0b','cm4e7eq6r004s70zanq09nhn7');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq5k003i70za05kpxygw','cm4e7eq6r004s70zanq09nhn7');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq5m003k70zafn2x8pqq','cm4e7eq6r004s70zanq09nhn7');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq5n003m70zakbl29nxq','cm4e7eq6r004s70zanq09nhn7');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq5j003g70zascbsxjes','cm4e7eq6r004s70zanq09nhn7');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq5g003c70zan2zg4yps','cm4e7eq6r004s70zanq09nhn7');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq45001h70za2fcpi5j9','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq3y001770za9pf027by','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq41001b70zatnf8wl3j','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq43001d70za2999vrri','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq46001j70za1plglpxn','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq44001f70zah4q0ipdm','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq3z001970za4co0qb5d','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq3w001570za462kkony','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq4f001x70zat49mrsgv','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq49001n70zatc0wpqls','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq4b001r70zak9ikykxt','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq4c001t70zafylujzbn','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq4g001z70zalsbtvuvm','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq4e001v70za5kkn4xg9','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq4a001p70zacu586fuu','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq48001l70za1tfeqpix','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq4u002d70zad475j50s','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq4l002370zarczvm5vf','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq4p002770zafjnog0vm','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq4r002970zay62pngt6','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq4w002f70zataa23jv2','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq4s002b70zaso6llz4m','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq4n002570zasep6y52i','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq4i002170zapwrs7l6d','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq56002t70za9kc3lav7','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq4z002j70za8sfrd3zz','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq51002n70za6mq2bqx1','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq53002p70zazlah3u66','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq57002v70zav5wkw6iy','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq54002r70za58fr7ok5','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq50002l70zacpbrngag','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq4y002h70zaptp7nnl5','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq5f003970zanh4fduxz','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq59002z70zav8nbx104','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq5b003370za8rau43bj','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq5d003570zayb512j3l','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq5g003b70zatc6pu615','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq5e003770za6afbs5lp','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq5a003170zar488oam5','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq58002x70zao32349pq','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq5p003p70zag1finac4','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq5i003f70zalk9b33fk','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq5l003j70zaqp08hrwu','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq5n003l70zalldrik6r','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq5q003r70za6okv5lan','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq5o003n70za259fcore','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq5j003h70zahclzfb6q','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq5h003d70za5mrre67b','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq5t003v70za38l2yi7c','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq5v003z70zakcc0id21','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq5u003x70zaz1rnyxsx','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq5r003t70zaa3xwvm0h','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq61004b70za3jmzvlgp','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq64004f70za4gi3uwog','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq62004d70zajx45g7lj','cm4e7eq6w004t70zae526u26m');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cm4e7eq60004970zalhcvo8ey','cm4e7eq6w004t70zae526u26m');
PRAGMA foreign_keys=ON;