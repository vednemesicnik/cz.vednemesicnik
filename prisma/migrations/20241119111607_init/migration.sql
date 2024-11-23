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
    CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
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
CREATE TABLE "Role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Permission" (
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
CREATE TABLE "_PermissionToRole" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_PermissionToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "Permission" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_PermissionToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "Role" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_action_entity_access_key" ON "Permission"("action", "entity", "access");

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
CREATE INDEX "ArchivedIssue_authorId_idx" ON "ArchivedIssue"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "ArchivedIssueCover_issueId_key" ON "ArchivedIssueCover"("issueId");

-- CreateIndex
CREATE UNIQUE INDEX "ArchivedIssuePDF_fileName_key" ON "ArchivedIssuePDF"("fileName");

-- CreateIndex
CREATE UNIQUE INDEX "ArchivedIssuePDF_issueId_key" ON "ArchivedIssuePDF"("issueId");

-- CreateIndex
CREATE UNIQUE INDEX "EditorialBoardPosition_key_key" ON "EditorialBoardPosition"("key");

-- CreateIndex
CREATE UNIQUE INDEX "EditorialBoardPosition_order_key" ON "EditorialBoardPosition"("order");

-- CreateIndex
CREATE INDEX "EditorialBoardPosition_authorId_idx" ON "EditorialBoardPosition"("authorId");

-- CreateIndex
CREATE INDEX "EditorialBoardMember_authorId_idx" ON "EditorialBoardMember"("authorId");

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
CREATE UNIQUE INDEX "_PermissionToRole_AB_unique" ON "_PermissionToRole"("A", "B");

-- CreateIndex
CREATE INDEX "_PermissionToRole_B_index" ON "_PermissionToRole"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_EditorialBoardMemberToEditorialBoardPosition_AB_unique" ON "_EditorialBoardMemberToEditorialBoardPosition"("A", "B");

-- CreateIndex
CREATE INDEX "_EditorialBoardMemberToEditorialBoardPosition_B_index" ON "_EditorialBoardMemberToEditorialBoardPosition"("B");

-- Manually seed initial data

PRAGMA foreign_keys=OFF;
INSERT INTO User VALUES('cm3pu054500256ennvy3whxmz','spolek@vednemesicnik.cz','spolek@vednemesicnik.cz','Vedneměsíčník, z. s.',1732104006629,1732104006629,'cm3pu051h001y6ennrvbvukwi','cm3pu051x00246enn6wnzn5x9');

INSERT INTO Password VALUES('$2a$10$pGWEQR/yaQ7gAugm69XRXeLE5eDEpBuMlZad6P/5.bXFjaAc5NxDa','cm3pu054500256ennvy3whxmz');

INSERT INTO Author VALUES('cm3pu051x00246enn6wnzn5x9','Vedneměsíčník, z. s.',NULL,1732104006550,1732104006550);

INSERT INTO Role VALUES('cm3pu051h001y6ennrvbvukwi','owner','',1732104006533,1732104006533);
INSERT INTO Role VALUES('cm3pu051m001z6enn6gvxlvky','administrator','',1732104006538,1732104006538);
INSERT INTO Role VALUES('cm3pu051q00206enn77cb4kfr','editor','',1732104006542,1732104006542);
INSERT INTO Role VALUES('cm3pu051t00216enn693wos4o','author','',1732104006545,1732104006545);
INSERT INTO Role VALUES('cm3pu051v00226ennllatd34s','contributor','',1732104006548,1732104006548);

INSERT INTO Permission VALUES('cm3pu050500006enn7upaxe2n','create','archived_issue','own','',1732104006485,1732104006485);
INSERT INTO Permission VALUES('cm3pu050600016ennxw2yrd62','create','archived_issue','any','',1732104006487,1732104006487);
INSERT INTO Permission VALUES('cm3pu050700026enn1zyain01','publish','archived_issue','own','',1732104006488,1732104006488);
INSERT INTO Permission VALUES('cm3pu050800036enn2z6cdmzs','publish','archived_issue','any','',1732104006489,1732104006489);
INSERT INTO Permission VALUES('cm3pu050900046ennou9w8gzr','read','archived_issue','own','',1732104006489,1732104006489);
INSERT INTO Permission VALUES('cm3pu050900056ennimt1kb7b','read','archived_issue','any','',1732104006490,1732104006490);
INSERT INTO Permission VALUES('cm3pu050a00066ennfnwahx71','update','archived_issue','own','',1732104006491,1732104006491);
INSERT INTO Permission VALUES('cm3pu050b00076ennn08lbey9','update','archived_issue','any','',1732104006491,1732104006491);
INSERT INTO Permission VALUES('cm3pu050c00086enn8q21to1z','delete','archived_issue','own','',1732104006492,1732104006492);
INSERT INTO Permission VALUES('cm3pu050c00096enn5su11ja1','delete','archived_issue','any','',1732104006493,1732104006493);
INSERT INTO Permission VALUES('cm3pu050d000a6ennn3xr8ueo','create','editorial_board_member','own','',1732104006493,1732104006493);
INSERT INTO Permission VALUES('cm3pu050d000b6enniyt6jbyu','create','editorial_board_member','any','',1732104006494,1732104006494);
INSERT INTO Permission VALUES('cm3pu050e000c6ennnoqbdneg','publish','editorial_board_member','own','',1732104006495,1732104006495);
INSERT INTO Permission VALUES('cm3pu050f000d6ennqdiow4sc','publish','editorial_board_member','any','',1732104006495,1732104006495);
INSERT INTO Permission VALUES('cm3pu050f000e6ennncf6bgdx','read','editorial_board_member','own','',1732104006496,1732104006496);
INSERT INTO Permission VALUES('cm3pu050g000f6ennetysmc82','read','editorial_board_member','any','',1732104006496,1732104006496);
INSERT INTO Permission VALUES('cm3pu050g000g6enn4fvnqa1q','update','editorial_board_member','own','',1732104006497,1732104006497);
INSERT INTO Permission VALUES('cm3pu050h000h6ennpa02ynxz','update','editorial_board_member','any','',1732104006497,1732104006497);
INSERT INTO Permission VALUES('cm3pu050h000i6enn7mi4jgm0','delete','editorial_board_member','own','',1732104006498,1732104006498);
INSERT INTO Permission VALUES('cm3pu050i000j6ennoy2503jh','delete','editorial_board_member','any','',1732104006498,1732104006498);
INSERT INTO Permission VALUES('cm3pu050j000k6enn1e66cug7','create','editorial_board_member_position','own','',1732104006499,1732104006499);
INSERT INTO Permission VALUES('cm3pu050j000l6ennz7nzw62o','create','editorial_board_member_position','any','',1732104006500,1732104006500);
INSERT INTO Permission VALUES('cm3pu050k000m6ennbm69un7r','publish','editorial_board_member_position','own','',1732104006500,1732104006500);
INSERT INTO Permission VALUES('cm3pu050k000n6ennu3hki1lq','publish','editorial_board_member_position','any','',1732104006501,1732104006501);
INSERT INTO Permission VALUES('cm3pu050l000o6enn81fixz9s','read','editorial_board_member_position','own','',1732104006501,1732104006501);
INSERT INTO Permission VALUES('cm3pu050l000p6enn1d3xwp0c','read','editorial_board_member_position','any','',1732104006502,1732104006502);
INSERT INTO Permission VALUES('cm3pu050m000q6enn0omggdxd','update','editorial_board_member_position','own','',1732104006502,1732104006502);
INSERT INTO Permission VALUES('cm3pu050m000r6enn551fuq35','update','editorial_board_member_position','any','',1732104006503,1732104006503);
INSERT INTO Permission VALUES('cm3pu050n000s6ennb7qabv3b','delete','editorial_board_member_position','own','',1732104006504,1732104006504);
INSERT INTO Permission VALUES('cm3pu050o000t6ennerb7kf7s','delete','editorial_board_member_position','any','',1732104006504,1732104006504);
INSERT INTO Permission VALUES('cm3pu050p000u6ennnycuoc69','create','podcast','own','',1732104006505,1732104006505);
INSERT INTO Permission VALUES('cm3pu050r000v6ennynmki5ey','create','podcast','any','',1732104006507,1732104006507);
INSERT INTO Permission VALUES('cm3pu050s000w6ennbrdequg1','publish','podcast','own','',1732104006508,1732104006508);
INSERT INTO Permission VALUES('cm3pu050s000x6enn3t15y314','publish','podcast','any','',1732104006509,1732104006509);
INSERT INTO Permission VALUES('cm3pu050t000y6ennmrnfpdng','read','podcast','own','',1732104006509,1732104006509);
INSERT INTO Permission VALUES('cm3pu050t000z6ennp3png23g','read','podcast','any','',1732104006510,1732104006510);
INSERT INTO Permission VALUES('cm3pu050u00106ennmyjv7waz','update','podcast','own','',1732104006510,1732104006510);
INSERT INTO Permission VALUES('cm3pu050u00116ennq3fara3d','update','podcast','any','',1732104006511,1732104006511);
INSERT INTO Permission VALUES('cm3pu050v00126ennf47ojht5','delete','podcast','own','',1732104006511,1732104006511);
INSERT INTO Permission VALUES('cm3pu050v00136ennycz9eie6','delete','podcast','any','',1732104006512,1732104006512);
INSERT INTO Permission VALUES('cm3pu050w00146enntjyhtq36','create','podcast_episode','own','',1732104006512,1732104006512);
INSERT INTO Permission VALUES('cm3pu050w00156enn0efxgp25','create','podcast_episode','any','',1732104006513,1732104006513);
INSERT INTO Permission VALUES('cm3pu050x00166enn4almp7rj','publish','podcast_episode','own','',1732104006513,1732104006513);
INSERT INTO Permission VALUES('cm3pu050x00176ennbjpz961w','publish','podcast_episode','any','',1732104006514,1732104006514);
INSERT INTO Permission VALUES('cm3pu050y00186enn1sprzc5q','read','podcast_episode','own','',1732104006514,1732104006514);
INSERT INTO Permission VALUES('cm3pu050y00196enn9qj42slp','read','podcast_episode','any','',1732104006515,1732104006515);
INSERT INTO Permission VALUES('cm3pu050z001a6ennqpvnw7g5','update','podcast_episode','own','',1732104006515,1732104006515);
INSERT INTO Permission VALUES('cm3pu050z001b6ennd2lta5fq','update','podcast_episode','any','',1732104006516,1732104006516);
INSERT INTO Permission VALUES('cm3pu0510001c6ennx34givaa','delete','podcast_episode','own','',1732104006516,1732104006516);
INSERT INTO Permission VALUES('cm3pu0510001d6enn474aljzq','delete','podcast_episode','any','',1732104006517,1732104006517);
INSERT INTO Permission VALUES('cm3pu0511001e6ennd9n1jj5y','create','podcast_episode_link','own','',1732104006518,1732104006518);
INSERT INTO Permission VALUES('cm3pu0512001f6enneoqsfu93','create','podcast_episode_link','any','',1732104006518,1732104006518);
INSERT INTO Permission VALUES('cm3pu0513001g6enn6mwu728k','publish','podcast_episode_link','own','',1732104006519,1732104006519);
INSERT INTO Permission VALUES('cm3pu0513001h6enn2os97w1v','publish','podcast_episode_link','any','',1732104006520,1732104006520);
INSERT INTO Permission VALUES('cm3pu0514001i6enn0swnc8xc','read','podcast_episode_link','own','',1732104006521,1732104006521);
INSERT INTO Permission VALUES('cm3pu0515001j6ennzgp50j3h','read','podcast_episode_link','any','',1732104006521,1732104006521);
INSERT INTO Permission VALUES('cm3pu0516001k6ennn327x3y4','update','podcast_episode_link','own','',1732104006522,1732104006522);
INSERT INTO Permission VALUES('cm3pu0516001l6ennos45ogl1','update','podcast_episode_link','any','',1732104006523,1732104006523);
INSERT INTO Permission VALUES('cm3pu0517001m6ennkdfnvrpy','delete','podcast_episode_link','own','',1732104006524,1732104006524);
INSERT INTO Permission VALUES('cm3pu0518001n6ennehqh0bje','delete','podcast_episode_link','any','',1732104006524,1732104006524);
INSERT INTO Permission VALUES('cm3pu0518001o6enn8xpvy1rm','create','user','own','',1732104006525,1732104006525);
INSERT INTO Permission VALUES('cm3pu0519001p6ennmw9tbpxu','create','user','any','',1732104006525,1732104006525);
INSERT INTO Permission VALUES('cm3pu0519001q6enngcb5a7ze','publish','user','own','',1732104006526,1732104006526);
INSERT INTO Permission VALUES('cm3pu051a001r6ennkxy2v64h','publish','user','any','',1732104006526,1732104006526);
INSERT INTO Permission VALUES('cm3pu051a001s6ennsteom2ax','read','user','own','',1732104006527,1732104006527);
INSERT INTO Permission VALUES('cm3pu051b001t6enn475rjhel','read','user','any','',1732104006528,1732104006528);
INSERT INTO Permission VALUES('cm3pu051c001u6ennmgktszih','update','user','own','',1732104006528,1732104006528);
INSERT INTO Permission VALUES('cm3pu051c001v6enn5tdww4lb','update','user','any','',1732104006529,1732104006529);
INSERT INTO Permission VALUES('cm3pu051d001w6enn56d23h9z','delete','user','own','',1732104006529,1732104006529);
INSERT INTO Permission VALUES('cm3pu051e001x6ennn7547r9m','delete','user','any','',1732104006530,1732104006530);

INSERT INTO _PermissionToRole VALUES('cm3pu050600016ennxw2yrd62','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu050c00096enn5su11ja1','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu050800036enn2z6cdmzs','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu050900056ennimt1kb7b','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu050b00076ennn08lbey9','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu050500006enn7upaxe2n','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu050c00086enn8q21to1z','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu050700026enn1zyain01','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu050900046ennou9w8gzr','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu050a00066ennfnwahx71','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu050d000b6enniyt6jbyu','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu050i000j6ennoy2503jh','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu050g000f6ennetysmc82','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu050h000h6ennpa02ynxz','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu050d000a6ennn3xr8ueo','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu050h000i6enn7mi4jgm0','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu050f000e6ennncf6bgdx','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu050g000g6enn4fvnqa1q','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu050j000l6ennz7nzw62o','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu050o000t6ennerb7kf7s','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu050l000p6enn1d3xwp0c','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu050m000r6enn551fuq35','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu050j000k6enn1e66cug7','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu050n000s6ennb7qabv3b','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu050l000o6enn81fixz9s','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu050m000q6enn0omggdxd','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu050r000v6ennynmki5ey','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu050v00136ennycz9eie6','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu050s000x6enn3t15y314','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu050t000z6ennp3png23g','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu050u00116ennq3fara3d','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu050p000u6ennnycuoc69','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu050v00126ennf47ojht5','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu050s000w6ennbrdequg1','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu050t000y6ennmrnfpdng','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu050u00106ennmyjv7waz','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu050w00156enn0efxgp25','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu0510001d6enn474aljzq','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu050x00176ennbjpz961w','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu050y00196enn9qj42slp','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu050z001b6ennd2lta5fq','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu050w00146enntjyhtq36','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu0510001c6ennx34givaa','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu050x00166enn4almp7rj','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu050y00186enn1sprzc5q','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu050z001a6ennqpvnw7g5','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu0512001f6enneoqsfu93','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu0518001n6ennehqh0bje','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu0515001j6ennzgp50j3h','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu0516001l6ennos45ogl1','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu0511001e6ennd9n1jj5y','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu0517001m6ennkdfnvrpy','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu0514001i6enn0swnc8xc','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu0516001k6ennn327x3y4','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu0519001p6ennmw9tbpxu','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu051e001x6ennn7547r9m','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu051b001t6enn475rjhel','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu051c001v6enn5tdww4lb','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu0518001o6enn8xpvy1rm','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu051d001w6enn56d23h9z','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu051a001s6ennsteom2ax','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu051c001u6ennmgktszih','cm3pu051h001y6ennrvbvukwi');
INSERT INTO _PermissionToRole VALUES('cm3pu050600016ennxw2yrd62','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu050c00096enn5su11ja1','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu050800036enn2z6cdmzs','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu050900056ennimt1kb7b','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu050b00076ennn08lbey9','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu050500006enn7upaxe2n','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu050c00086enn8q21to1z','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu050700026enn1zyain01','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu050900046ennou9w8gzr','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu050a00066ennfnwahx71','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu050d000b6enniyt6jbyu','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu050i000j6ennoy2503jh','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu050g000f6ennetysmc82','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu050h000h6ennpa02ynxz','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu050d000a6ennn3xr8ueo','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu050h000i6enn7mi4jgm0','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu050f000e6ennncf6bgdx','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu050g000g6enn4fvnqa1q','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu050j000l6ennz7nzw62o','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu050o000t6ennerb7kf7s','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu050l000p6enn1d3xwp0c','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu050m000r6enn551fuq35','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu050j000k6enn1e66cug7','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu050n000s6ennb7qabv3b','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu050l000o6enn81fixz9s','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu050m000q6enn0omggdxd','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu050r000v6ennynmki5ey','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu050v00136ennycz9eie6','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu050s000x6enn3t15y314','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu050t000z6ennp3png23g','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu050u00116ennq3fara3d','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu050p000u6ennnycuoc69','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu050v00126ennf47ojht5','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu050s000w6ennbrdequg1','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu050t000y6ennmrnfpdng','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu050u00106ennmyjv7waz','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu050w00156enn0efxgp25','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu0510001d6enn474aljzq','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu050x00176ennbjpz961w','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu050y00196enn9qj42slp','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu050z001b6ennd2lta5fq','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu050w00146enntjyhtq36','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu0510001c6ennx34givaa','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu050x00166enn4almp7rj','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu050y00186enn1sprzc5q','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu050z001a6ennqpvnw7g5','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu0512001f6enneoqsfu93','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu0518001n6ennehqh0bje','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu0515001j6ennzgp50j3h','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu0516001l6ennos45ogl1','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu0511001e6ennd9n1jj5y','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu0517001m6ennkdfnvrpy','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu0514001i6enn0swnc8xc','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu0516001k6ennn327x3y4','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu0519001p6ennmw9tbpxu','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu051b001t6enn475rjhel','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu051c001v6enn5tdww4lb','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu0518001o6enn8xpvy1rm','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu051a001s6ennsteom2ax','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu051c001u6ennmgktszih','cm3pu051m001z6enn6gvxlvky');
INSERT INTO _PermissionToRole VALUES('cm3pu050600016ennxw2yrd62','cm3pu051q00206enn77cb4kfr');
INSERT INTO _PermissionToRole VALUES('cm3pu050800036enn2z6cdmzs','cm3pu051q00206enn77cb4kfr');
INSERT INTO _PermissionToRole VALUES('cm3pu050900056ennimt1kb7b','cm3pu051q00206enn77cb4kfr');
INSERT INTO _PermissionToRole VALUES('cm3pu050b00076ennn08lbey9','cm3pu051q00206enn77cb4kfr');
INSERT INTO _PermissionToRole VALUES('cm3pu050500006enn7upaxe2n','cm3pu051q00206enn77cb4kfr');
INSERT INTO _PermissionToRole VALUES('cm3pu050700026enn1zyain01','cm3pu051q00206enn77cb4kfr');
INSERT INTO _PermissionToRole VALUES('cm3pu050900046ennou9w8gzr','cm3pu051q00206enn77cb4kfr');
INSERT INTO _PermissionToRole VALUES('cm3pu050a00066ennfnwahx71','cm3pu051q00206enn77cb4kfr');
INSERT INTO _PermissionToRole VALUES('cm3pu050d000b6enniyt6jbyu','cm3pu051q00206enn77cb4kfr');
INSERT INTO _PermissionToRole VALUES('cm3pu050g000f6ennetysmc82','cm3pu051q00206enn77cb4kfr');
INSERT INTO _PermissionToRole VALUES('cm3pu050h000h6ennpa02ynxz','cm3pu051q00206enn77cb4kfr');
INSERT INTO _PermissionToRole VALUES('cm3pu050d000a6ennn3xr8ueo','cm3pu051q00206enn77cb4kfr');
INSERT INTO _PermissionToRole VALUES('cm3pu050f000e6ennncf6bgdx','cm3pu051q00206enn77cb4kfr');
INSERT INTO _PermissionToRole VALUES('cm3pu050g000g6enn4fvnqa1q','cm3pu051q00206enn77cb4kfr');
INSERT INTO _PermissionToRole VALUES('cm3pu050j000l6ennz7nzw62o','cm3pu051q00206enn77cb4kfr');
INSERT INTO _PermissionToRole VALUES('cm3pu050l000p6enn1d3xwp0c','cm3pu051q00206enn77cb4kfr');
INSERT INTO _PermissionToRole VALUES('cm3pu050m000r6enn551fuq35','cm3pu051q00206enn77cb4kfr');
INSERT INTO _PermissionToRole VALUES('cm3pu050j000k6enn1e66cug7','cm3pu051q00206enn77cb4kfr');
INSERT INTO _PermissionToRole VALUES('cm3pu050l000o6enn81fixz9s','cm3pu051q00206enn77cb4kfr');
INSERT INTO _PermissionToRole VALUES('cm3pu050m000q6enn0omggdxd','cm3pu051q00206enn77cb4kfr');
INSERT INTO _PermissionToRole VALUES('cm3pu050r000v6ennynmki5ey','cm3pu051q00206enn77cb4kfr');
INSERT INTO _PermissionToRole VALUES('cm3pu050s000x6enn3t15y314','cm3pu051q00206enn77cb4kfr');
INSERT INTO _PermissionToRole VALUES('cm3pu050t000z6ennp3png23g','cm3pu051q00206enn77cb4kfr');
INSERT INTO _PermissionToRole VALUES('cm3pu050u00116ennq3fara3d','cm3pu051q00206enn77cb4kfr');
INSERT INTO _PermissionToRole VALUES('cm3pu050p000u6ennnycuoc69','cm3pu051q00206enn77cb4kfr');
INSERT INTO _PermissionToRole VALUES('cm3pu050s000w6ennbrdequg1','cm3pu051q00206enn77cb4kfr');
INSERT INTO _PermissionToRole VALUES('cm3pu050t000y6ennmrnfpdng','cm3pu051q00206enn77cb4kfr');
INSERT INTO _PermissionToRole VALUES('cm3pu050u00106ennmyjv7waz','cm3pu051q00206enn77cb4kfr');
INSERT INTO _PermissionToRole VALUES('cm3pu050w00156enn0efxgp25','cm3pu051q00206enn77cb4kfr');
INSERT INTO _PermissionToRole VALUES('cm3pu050x00176ennbjpz961w','cm3pu051q00206enn77cb4kfr');
INSERT INTO _PermissionToRole VALUES('cm3pu050y00196enn9qj42slp','cm3pu051q00206enn77cb4kfr');
INSERT INTO _PermissionToRole VALUES('cm3pu050z001b6ennd2lta5fq','cm3pu051q00206enn77cb4kfr');
INSERT INTO _PermissionToRole VALUES('cm3pu050w00146enntjyhtq36','cm3pu051q00206enn77cb4kfr');
INSERT INTO _PermissionToRole VALUES('cm3pu050x00166enn4almp7rj','cm3pu051q00206enn77cb4kfr');
INSERT INTO _PermissionToRole VALUES('cm3pu050y00186enn1sprzc5q','cm3pu051q00206enn77cb4kfr');
INSERT INTO _PermissionToRole VALUES('cm3pu050z001a6ennqpvnw7g5','cm3pu051q00206enn77cb4kfr');
INSERT INTO _PermissionToRole VALUES('cm3pu0512001f6enneoqsfu93','cm3pu051q00206enn77cb4kfr');
INSERT INTO _PermissionToRole VALUES('cm3pu0513001h6enn2os97w1v','cm3pu051q00206enn77cb4kfr');
INSERT INTO _PermissionToRole VALUES('cm3pu0515001j6ennzgp50j3h','cm3pu051q00206enn77cb4kfr');
INSERT INTO _PermissionToRole VALUES('cm3pu0516001l6ennos45ogl1','cm3pu051q00206enn77cb4kfr');
INSERT INTO _PermissionToRole VALUES('cm3pu0511001e6ennd9n1jj5y','cm3pu051q00206enn77cb4kfr');
INSERT INTO _PermissionToRole VALUES('cm3pu0513001g6enn6mwu728k','cm3pu051q00206enn77cb4kfr');
INSERT INTO _PermissionToRole VALUES('cm3pu0514001i6enn0swnc8xc','cm3pu051q00206enn77cb4kfr');
INSERT INTO _PermissionToRole VALUES('cm3pu0516001k6ennn327x3y4','cm3pu051q00206enn77cb4kfr');
INSERT INTO _PermissionToRole VALUES('cm3pu050900056ennimt1kb7b','cm3pu051t00216enn693wos4o');
INSERT INTO _PermissionToRole VALUES('cm3pu050500006enn7upaxe2n','cm3pu051t00216enn693wos4o');
INSERT INTO _PermissionToRole VALUES('cm3pu050700026enn1zyain01','cm3pu051t00216enn693wos4o');
INSERT INTO _PermissionToRole VALUES('cm3pu050900046ennou9w8gzr','cm3pu051t00216enn693wos4o');
INSERT INTO _PermissionToRole VALUES('cm3pu050a00066ennfnwahx71','cm3pu051t00216enn693wos4o');
INSERT INTO _PermissionToRole VALUES('cm3pu050g000f6ennetysmc82','cm3pu051t00216enn693wos4o');
INSERT INTO _PermissionToRole VALUES('cm3pu050d000a6ennn3xr8ueo','cm3pu051t00216enn693wos4o');
INSERT INTO _PermissionToRole VALUES('cm3pu050f000e6ennncf6bgdx','cm3pu051t00216enn693wos4o');
INSERT INTO _PermissionToRole VALUES('cm3pu050g000g6enn4fvnqa1q','cm3pu051t00216enn693wos4o');
INSERT INTO _PermissionToRole VALUES('cm3pu050l000p6enn1d3xwp0c','cm3pu051t00216enn693wos4o');
INSERT INTO _PermissionToRole VALUES('cm3pu050j000k6enn1e66cug7','cm3pu051t00216enn693wos4o');
INSERT INTO _PermissionToRole VALUES('cm3pu050l000o6enn81fixz9s','cm3pu051t00216enn693wos4o');
INSERT INTO _PermissionToRole VALUES('cm3pu050m000q6enn0omggdxd','cm3pu051t00216enn693wos4o');
INSERT INTO _PermissionToRole VALUES('cm3pu050t000z6ennp3png23g','cm3pu051t00216enn693wos4o');
INSERT INTO _PermissionToRole VALUES('cm3pu050p000u6ennnycuoc69','cm3pu051t00216enn693wos4o');
INSERT INTO _PermissionToRole VALUES('cm3pu050s000w6ennbrdequg1','cm3pu051t00216enn693wos4o');
INSERT INTO _PermissionToRole VALUES('cm3pu050t000y6ennmrnfpdng','cm3pu051t00216enn693wos4o');
INSERT INTO _PermissionToRole VALUES('cm3pu050u00106ennmyjv7waz','cm3pu051t00216enn693wos4o');
INSERT INTO _PermissionToRole VALUES('cm3pu050y00196enn9qj42slp','cm3pu051t00216enn693wos4o');
INSERT INTO _PermissionToRole VALUES('cm3pu050w00146enntjyhtq36','cm3pu051t00216enn693wos4o');
INSERT INTO _PermissionToRole VALUES('cm3pu050x00166enn4almp7rj','cm3pu051t00216enn693wos4o');
INSERT INTO _PermissionToRole VALUES('cm3pu050y00186enn1sprzc5q','cm3pu051t00216enn693wos4o');
INSERT INTO _PermissionToRole VALUES('cm3pu050z001a6ennqpvnw7g5','cm3pu051t00216enn693wos4o');
INSERT INTO _PermissionToRole VALUES('cm3pu0515001j6ennzgp50j3h','cm3pu051t00216enn693wos4o');
INSERT INTO _PermissionToRole VALUES('cm3pu0511001e6ennd9n1jj5y','cm3pu051t00216enn693wos4o');
INSERT INTO _PermissionToRole VALUES('cm3pu0513001g6enn6mwu728k','cm3pu051t00216enn693wos4o');
INSERT INTO _PermissionToRole VALUES('cm3pu0514001i6enn0swnc8xc','cm3pu051t00216enn693wos4o');
INSERT INTO _PermissionToRole VALUES('cm3pu0516001k6ennn327x3y4','cm3pu051t00216enn693wos4o');
INSERT INTO _PermissionToRole VALUES('cm3pu050900056ennimt1kb7b','cm3pu051v00226ennllatd34s');
INSERT INTO _PermissionToRole VALUES('cm3pu050500006enn7upaxe2n','cm3pu051v00226ennllatd34s');
INSERT INTO _PermissionToRole VALUES('cm3pu050900046ennou9w8gzr','cm3pu051v00226ennllatd34s');
INSERT INTO _PermissionToRole VALUES('cm3pu050a00066ennfnwahx71','cm3pu051v00226ennllatd34s');
INSERT INTO _PermissionToRole VALUES('cm3pu050t000z6ennp3png23g','cm3pu051v00226ennllatd34s');
INSERT INTO _PermissionToRole VALUES('cm3pu050p000u6ennnycuoc69','cm3pu051v00226ennllatd34s');
INSERT INTO _PermissionToRole VALUES('cm3pu050t000y6ennmrnfpdng','cm3pu051v00226ennllatd34s');
INSERT INTO _PermissionToRole VALUES('cm3pu050u00106ennmyjv7waz','cm3pu051v00226ennllatd34s');
INSERT INTO _PermissionToRole VALUES('cm3pu050y00196enn9qj42slp','cm3pu051v00226ennllatd34s');
INSERT INTO _PermissionToRole VALUES('cm3pu050w00146enntjyhtq36','cm3pu051v00226ennllatd34s');
INSERT INTO _PermissionToRole VALUES('cm3pu050y00186enn1sprzc5q','cm3pu051v00226ennllatd34s');
INSERT INTO _PermissionToRole VALUES('cm3pu050z001a6ennqpvnw7g5','cm3pu051v00226ennllatd34s');
INSERT INTO _PermissionToRole VALUES('cm3pu0515001j6ennzgp50j3h','cm3pu051v00226ennllatd34s');
INSERT INTO _PermissionToRole VALUES('cm3pu0511001e6ennd9n1jj5y','cm3pu051v00226ennllatd34s');
INSERT INTO _PermissionToRole VALUES('cm3pu0514001i6enn0swnc8xc','cm3pu051v00226ennllatd34s');
INSERT INTO _PermissionToRole VALUES('cm3pu0516001k6ennn327x3y4','cm3pu051v00226ennllatd34s');
PRAGMA foreign_keys=ON;