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
INSERT INTO User VALUES('cm3u0yduj003v6lkh3d7cmekz','spolek@vednemesicnik.cz','spolek@vednemesicnik.cz','Vedneměsíčník, z. s.',1732357546651,1732357546651,'cm3u0ydr1003o6lkhn6nd42rw','cm3u0yds7003u6lkhuc3wgabq');

INSERT INTO Password VALUES('$2a$10$GuYxqd28Np.jb6TQCTWNtO2KPgIARYn/oeIF/yNuetJZJhLS5qxtC','cm3u0yduj003v6lkh3d7cmekz');

INSERT INTO Author VALUES('cm3u0yds7003u6lkhuc3wgabq','Vedneměsíčník, z. s.',NULL,1732357546568,1732357546568);

INSERT INTO Role VALUES('cm3u0ydr1003o6lkhn6nd42rw','owner','',1732357546526,1732357546526);
INSERT INTO Role VALUES('cm3u0ydrd003p6lkh88cgmdne','administrator','',1732357546537,1732357546537);
INSERT INTO Role VALUES('cm3u0ydrn003q6lkhbc0gjizr','editor','',1732357546547,1732357546547);
INSERT INTO Role VALUES('cm3u0ydrz003r6lkh0gezs9nn','author','',1732357546560,1732357546560);
INSERT INTO Role VALUES('cm3u0yds4003s6lkhn1hfgqgm','contributor','',1732357546564,1732357546564);

INSERT INTO Permission VALUES('cm3u0ydoo00006lkhc23zz4ll','create','archived_issue','own','',1732357546440,1732357546440);
INSERT INTO Permission VALUES('cm3u0ydop00016lkh34vzjzbk','create','archived_issue','any','',1732357546441,1732357546441);
INSERT INTO Permission VALUES('cm3u0ydoq00026lkhkk96tc2c','publish','archived_issue','own','',1732357546442,1732357546442);
INSERT INTO Permission VALUES('cm3u0ydoq00036lkhrsmg0xb1','publish','archived_issue','any','',1732357546443,1732357546443);
INSERT INTO Permission VALUES('cm3u0ydor00046lkhj1vp0p0u','read','archived_issue','own','',1732357546444,1732357546444);
INSERT INTO Permission VALUES('cm3u0ydos00056lkhc1h6t9ne','read','archived_issue','any','',1732357546444,1732357546444);
INSERT INTO Permission VALUES('cm3u0ydos00066lkh8ts4171g','update','archived_issue','own','',1732357546445,1732357546445);
INSERT INTO Permission VALUES('cm3u0ydot00076lkhwo364yf2','update','archived_issue','any','',1732357546446,1732357546446);
INSERT INTO Permission VALUES('cm3u0ydou00086lkhyf06vwlb','update_role','archived_issue','own','',1732357546446,1732357546446);
INSERT INTO Permission VALUES('cm3u0ydou00096lkhw93clypo','update_role','archived_issue','any','',1732357546447,1732357546447);
INSERT INTO Permission VALUES('cm3u0ydov000a6lkhh7w8uvri','delete','archived_issue','own','',1732357546448,1732357546448);
INSERT INTO Permission VALUES('cm3u0ydow000b6lkh83tyumyf','delete','archived_issue','any','',1732357546448,1732357546448);
INSERT INTO Permission VALUES('cm3u0ydox000c6lkh7xq4dhgr','create','editorial_board_member','own','',1732357546449,1732357546449);
INSERT INTO Permission VALUES('cm3u0ydox000d6lkhi9yzi3f0','create','editorial_board_member','any','',1732357546450,1732357546450);
INSERT INTO Permission VALUES('cm3u0ydoy000e6lkhsm2hybzh','publish','editorial_board_member','own','',1732357546450,1732357546450);
INSERT INTO Permission VALUES('cm3u0ydoy000f6lkhgq8i3w3g','publish','editorial_board_member','any','',1732357546451,1732357546451);
INSERT INTO Permission VALUES('cm3u0ydoz000g6lkh208gw3hi','read','editorial_board_member','own','',1732357546452,1732357546452);
INSERT INTO Permission VALUES('cm3u0ydp0000h6lkhl9v1wb0f','read','editorial_board_member','any','',1732357546453,1732357546453);
INSERT INTO Permission VALUES('cm3u0ydp1000i6lkhz93iz1uw','update','editorial_board_member','own','',1732357546453,1732357546453);
INSERT INTO Permission VALUES('cm3u0ydp1000j6lkhxaz8q25o','update','editorial_board_member','any','',1732357546454,1732357546454);
INSERT INTO Permission VALUES('cm3u0ydp2000k6lkh79gxnh79','update_role','editorial_board_member','own','',1732357546454,1732357546454);
INSERT INTO Permission VALUES('cm3u0ydp2000l6lkhwj6uvdjb','update_role','editorial_board_member','any','',1732357546455,1732357546455);
INSERT INTO Permission VALUES('cm3u0ydp3000m6lkhicwazjob','delete','editorial_board_member','own','',1732357546455,1732357546455);
INSERT INTO Permission VALUES('cm3u0ydp3000n6lkh5b37yu59','delete','editorial_board_member','any','',1732357546456,1732357546456);
INSERT INTO Permission VALUES('cm3u0ydp4000o6lkh235g6g7h','create','editorial_board_member_position','own','',1732357546456,1732357546456);
INSERT INTO Permission VALUES('cm3u0ydp4000p6lkh2pexx7bf','create','editorial_board_member_position','any','',1732357546457,1732357546457);
INSERT INTO Permission VALUES('cm3u0ydp5000q6lkh0ejswafy','publish','editorial_board_member_position','own','',1732357546457,1732357546457);
INSERT INTO Permission VALUES('cm3u0ydp5000r6lkhepzs34kx','publish','editorial_board_member_position','any','',1732357546458,1732357546458);
INSERT INTO Permission VALUES('cm3u0ydp6000s6lkhttovk7su','read','editorial_board_member_position','own','',1732357546458,1732357546458);
INSERT INTO Permission VALUES('cm3u0ydp7000t6lkhhcdn3wbl','read','editorial_board_member_position','any','',1732357546459,1732357546459);
INSERT INTO Permission VALUES('cm3u0ydp7000u6lkhjm9esu15','update','editorial_board_member_position','own','',1732357546460,1732357546460);
INSERT INTO Permission VALUES('cm3u0ydp8000v6lkhdcnyiuih','update','editorial_board_member_position','any','',1732357546460,1732357546460);
INSERT INTO Permission VALUES('cm3u0ydp8000w6lkhckfk8dxp','update_role','editorial_board_member_position','own','',1732357546461,1732357546461);
INSERT INTO Permission VALUES('cm3u0ydp9000x6lkhd4snaxua','update_role','editorial_board_member_position','any','',1732357546461,1732357546461);
INSERT INTO Permission VALUES('cm3u0ydp9000y6lkh30j3mx3i','delete','editorial_board_member_position','own','',1732357546462,1732357546462);
INSERT INTO Permission VALUES('cm3u0ydpa000z6lkhhey1axb3','delete','editorial_board_member_position','any','',1732357546462,1732357546462);
INSERT INTO Permission VALUES('cm3u0ydpb00106lkhs3lj93de','create','podcast','own','',1732357546463,1732357546463);
INSERT INTO Permission VALUES('cm3u0ydpb00116lkhkpztsycd','create','podcast','any','',1732357546464,1732357546464);
INSERT INTO Permission VALUES('cm3u0ydpc00126lkhq5zgz1b7','publish','podcast','own','',1732357546464,1732357546464);
INSERT INTO Permission VALUES('cm3u0ydpc00136lkhjvfj6w3t','publish','podcast','any','',1732357546465,1732357546465);
INSERT INTO Permission VALUES('cm3u0ydpd00146lkhmwpiymg7','read','podcast','own','',1732357546465,1732357546465);
INSERT INTO Permission VALUES('cm3u0ydpd00156lkhej8xq80i','read','podcast','any','',1732357546466,1732357546466);
INSERT INTO Permission VALUES('cm3u0ydpe00166lkh6oc9txdn','update','podcast','own','',1732357546466,1732357546466);
INSERT INTO Permission VALUES('cm3u0ydpf00176lkhts8nyk9p','update','podcast','any','',1732357546467,1732357546467);
INSERT INTO Permission VALUES('cm3u0ydpg00186lkhg6y7uie7','update_role','podcast','own','',1732357546468,1732357546468);
INSERT INTO Permission VALUES('cm3u0ydph00196lkhpbwuj30v','update_role','podcast','any','',1732357546469,1732357546469);
INSERT INTO Permission VALUES('cm3u0ydph001a6lkhcw723ehj','delete','podcast','own','',1732357546470,1732357546470);
INSERT INTO Permission VALUES('cm3u0ydpi001b6lkhjj3rbfz8','delete','podcast','any','',1732357546471,1732357546471);
INSERT INTO Permission VALUES('cm3u0ydpj001c6lkhgkmpjqy3','create','podcast_episode','own','',1732357546472,1732357546472);
INSERT INTO Permission VALUES('cm3u0ydpk001d6lkh3rn2zjq7','create','podcast_episode','any','',1732357546473,1732357546473);
INSERT INTO Permission VALUES('cm3u0ydpl001e6lkhpt4loc4c','publish','podcast_episode','own','',1732357546473,1732357546473);
INSERT INTO Permission VALUES('cm3u0ydpm001f6lkhue92xnny','publish','podcast_episode','any','',1732357546474,1732357546474);
INSERT INTO Permission VALUES('cm3u0ydpm001g6lkhdr5wvk2e','read','podcast_episode','own','',1732357546475,1732357546475);
INSERT INTO Permission VALUES('cm3u0ydpn001h6lkh3fs863pe','read','podcast_episode','any','',1732357546475,1732357546475);
INSERT INTO Permission VALUES('cm3u0ydpn001i6lkh8phwtrcs','update','podcast_episode','own','',1732357546476,1732357546476);
INSERT INTO Permission VALUES('cm3u0ydpo001j6lkhfcpi6t47','update','podcast_episode','any','',1732357546477,1732357546477);
INSERT INTO Permission VALUES('cm3u0ydpp001k6lkh1k8eny77','update_role','podcast_episode','own','',1732357546477,1732357546477);
INSERT INTO Permission VALUES('cm3u0ydpp001l6lkhmxz709yc','update_role','podcast_episode','any','',1732357546478,1732357546478);
INSERT INTO Permission VALUES('cm3u0ydpq001m6lkhj9x9mr1u','delete','podcast_episode','own','',1732357546478,1732357546478);
INSERT INTO Permission VALUES('cm3u0ydpr001n6lkhao2qepcj','delete','podcast_episode','any','',1732357546479,1732357546479);
INSERT INTO Permission VALUES('cm3u0ydps001o6lkh02kg2p8h','create','podcast_episode_link','own','',1732357546480,1732357546480);
INSERT INTO Permission VALUES('cm3u0ydpt001p6lkhfjnw5ufa','create','podcast_episode_link','any','',1732357546482,1732357546482);
INSERT INTO Permission VALUES('cm3u0ydpu001q6lkh8o235psq','publish','podcast_episode_link','own','',1732357546482,1732357546482);
INSERT INTO Permission VALUES('cm3u0ydpu001r6lkh7h4ajgw2','publish','podcast_episode_link','any','',1732357546483,1732357546483);
INSERT INTO Permission VALUES('cm3u0ydpv001s6lkhtv2u38cy','read','podcast_episode_link','own','',1732357546483,1732357546483);
INSERT INTO Permission VALUES('cm3u0ydpv001t6lkh48g5hmfe','read','podcast_episode_link','any','',1732357546484,1732357546484);
INSERT INTO Permission VALUES('cm3u0ydpw001u6lkhf8x0of5d','update','podcast_episode_link','own','',1732357546484,1732357546484);
INSERT INTO Permission VALUES('cm3u0ydpw001v6lkh3rgt40tz','update','podcast_episode_link','any','',1732357546484,1732357546484);
INSERT INTO Permission VALUES('cm3u0ydpx001w6lkh21mt774j','update_role','podcast_episode_link','own','',1732357546485,1732357546485);
INSERT INTO Permission VALUES('cm3u0ydpx001x6lkh486a5u5s','update_role','podcast_episode_link','any','',1732357546485,1732357546485);
INSERT INTO Permission VALUES('cm3u0ydpy001y6lkhhrlz5bxg','delete','podcast_episode_link','own','',1732357546486,1732357546486);
INSERT INTO Permission VALUES('cm3u0ydpy001z6lkh5413jjzx','delete','podcast_episode_link','any','',1732357546487,1732357546487);
INSERT INTO Permission VALUES('cm3u0ydpz00206lkh9vcidbc0','create','user_owner','own','',1732357546487,1732357546487);
INSERT INTO Permission VALUES('cm3u0ydpz00216lkhl6c8qcjy','create','user_owner','any','',1732357546488,1732357546488);
INSERT INTO Permission VALUES('cm3u0ydq000226lkh6bcn2yf1','publish','user_owner','own','',1732357546488,1732357546488);
INSERT INTO Permission VALUES('cm3u0ydq000236lkhjuzkvxzp','publish','user_owner','any','',1732357546489,1732357546489);
INSERT INTO Permission VALUES('cm3u0ydq100246lkh3tkhy5jt','read','user_owner','own','',1732357546489,1732357546489);
INSERT INTO Permission VALUES('cm3u0ydq200256lkhkxo05ibx','read','user_owner','any','',1732357546490,1732357546490);
INSERT INTO Permission VALUES('cm3u0ydq200266lkhq54uhle8','update','user_owner','own','',1732357546491,1732357546491);
INSERT INTO Permission VALUES('cm3u0ydq300276lkhgu9ejbex','update','user_owner','any','',1732357546492,1732357546492);
INSERT INTO Permission VALUES('cm3u0ydq400286lkh8qpnxz4j','update_role','user_owner','own','',1732357546492,1732357546492);
INSERT INTO Permission VALUES('cm3u0ydq400296lkhpgzet0nn','update_role','user_owner','any','',1732357546493,1732357546493);
INSERT INTO Permission VALUES('cm3u0ydq5002a6lkh4h7af6il','delete','user_owner','own','',1732357546494,1732357546494);
INSERT INTO Permission VALUES('cm3u0ydq6002b6lkhddh4q2yy','delete','user_owner','any','',1732357546494,1732357546494);
INSERT INTO Permission VALUES('cm3u0ydq6002c6lkhw7em86mb','create','user_administrator','own','',1732357546495,1732357546495);
INSERT INTO Permission VALUES('cm3u0ydq7002d6lkhtpe6n4r4','create','user_administrator','any','',1732357546496,1732357546496);
INSERT INTO Permission VALUES('cm3u0ydq8002e6lkh7fwm9ntt','publish','user_administrator','own','',1732357546496,1732357546496);
INSERT INTO Permission VALUES('cm3u0ydq8002f6lkhspgunxam','publish','user_administrator','any','',1732357546497,1732357546497);
INSERT INTO Permission VALUES('cm3u0ydq9002g6lkhmsoqy2xi','read','user_administrator','own','',1732357546498,1732357546498);
INSERT INTO Permission VALUES('cm3u0ydqa002h6lkhlxhm69ii','read','user_administrator','any','',1732357546498,1732357546498);
INSERT INTO Permission VALUES('cm3u0ydqa002i6lkh7mm46fgd','update','user_administrator','own','',1732357546499,1732357546499);
INSERT INTO Permission VALUES('cm3u0ydqb002j6lkho5m1oqpi','update','user_administrator','any','',1732357546499,1732357546499);
INSERT INTO Permission VALUES('cm3u0ydqb002k6lkh38861h48','update_role','user_administrator','own','',1732357546500,1732357546500);
INSERT INTO Permission VALUES('cm3u0ydqc002l6lkhvsy55or0','update_role','user_administrator','any','',1732357546501,1732357546501);
INSERT INTO Permission VALUES('cm3u0ydqd002m6lkhuubm0izw','delete','user_administrator','own','',1732357546501,1732357546501);
INSERT INTO Permission VALUES('cm3u0ydqd002n6lkhmlhxwlrh','delete','user_administrator','any','',1732357546502,1732357546502);
INSERT INTO Permission VALUES('cm3u0ydqe002o6lkheoqa2xbc','create','user_editor','own','',1732357546502,1732357546502);
INSERT INTO Permission VALUES('cm3u0ydqf002p6lkhqgvy1qnd','create','user_editor','any','',1732357546503,1732357546503);
INSERT INTO Permission VALUES('cm3u0ydqf002q6lkhj8k4qk21','publish','user_editor','own','',1732357546504,1732357546504);
INSERT INTO Permission VALUES('cm3u0ydqg002r6lkhk7ng6jeg','publish','user_editor','any','',1732357546504,1732357546504);
INSERT INTO Permission VALUES('cm3u0ydqg002s6lkhom67zpvi','read','user_editor','own','',1732357546505,1732357546505);
INSERT INTO Permission VALUES('cm3u0ydqh002t6lkh3p9bhjoz','read','user_editor','any','',1732357546505,1732357546505);
INSERT INTO Permission VALUES('cm3u0ydqh002u6lkh4nk9c2gv','update','user_editor','own','',1732357546506,1732357546506);
INSERT INTO Permission VALUES('cm3u0ydqi002v6lkhorr2tvmt','update','user_editor','any','',1732357546506,1732357546506);
INSERT INTO Permission VALUES('cm3u0ydqi002w6lkhrjhlxko9','update_role','user_editor','own','',1732357546507,1732357546507);
INSERT INTO Permission VALUES('cm3u0ydqj002x6lkh1t66d9bn','update_role','user_editor','any','',1732357546507,1732357546507);
INSERT INTO Permission VALUES('cm3u0ydqj002y6lkhz6sar1b7','delete','user_editor','own','',1732357546508,1732357546508);
INSERT INTO Permission VALUES('cm3u0ydqk002z6lkh6cqlvi0w','delete','user_editor','any','',1732357546508,1732357546508);
INSERT INTO Permission VALUES('cm3u0ydqk00306lkh4rjmtomz','create','user_author','own','',1732357546509,1732357546509);
INSERT INTO Permission VALUES('cm3u0ydql00316lkhxoskaoj0','create','user_author','any','',1732357546510,1732357546510);
INSERT INTO Permission VALUES('cm3u0ydqm00326lkhshxxlx5q','publish','user_author','own','',1732357546510,1732357546510);
INSERT INTO Permission VALUES('cm3u0ydqm00336lkhcuj5xfwx','publish','user_author','any','',1732357546511,1732357546511);
INSERT INTO Permission VALUES('cm3u0ydqn00346lkh6svkxwgs','read','user_author','own','',1732357546512,1732357546512);
INSERT INTO Permission VALUES('cm3u0ydqo00356lkhmj7wg2gg','read','user_author','any','',1732357546512,1732357546512);
INSERT INTO Permission VALUES('cm3u0ydqo00366lkhbvuply3r','update','user_author','own','',1732357546513,1732357546513);
INSERT INTO Permission VALUES('cm3u0ydqp00376lkhlyotlvky','update','user_author','any','',1732357546513,1732357546513);
INSERT INTO Permission VALUES('cm3u0ydqp00386lkh4t3fpz5d','update_role','user_author','own','',1732357546514,1732357546514);
INSERT INTO Permission VALUES('cm3u0ydqq00396lkh1f7gjb9x','update_role','user_author','any','',1732357546514,1732357546514);
INSERT INTO Permission VALUES('cm3u0ydqq003a6lkht1khn8oq','delete','user_author','own','',1732357546515,1732357546515);
INSERT INTO Permission VALUES('cm3u0ydqr003b6lkhpb3b10hw','delete','user_author','any','',1732357546515,1732357546515);
INSERT INTO Permission VALUES('cm3u0ydqr003c6lkhp2akf5z9','create','user_contributor','own','',1732357546516,1732357546516);
INSERT INTO Permission VALUES('cm3u0ydqs003d6lkhfk9v8dzq','create','user_contributor','any','',1732357546516,1732357546516);
INSERT INTO Permission VALUES('cm3u0ydqs003e6lkhz37f12q2','publish','user_contributor','own','',1732357546517,1732357546517);
INSERT INTO Permission VALUES('cm3u0ydqt003f6lkhcsjperip','publish','user_contributor','any','',1732357546517,1732357546517);
INSERT INTO Permission VALUES('cm3u0ydqt003g6lkh0wq9enjn','read','user_contributor','own','',1732357546518,1732357546518);
INSERT INTO Permission VALUES('cm3u0ydqu003h6lkhub8oo9mm','read','user_contributor','any','',1732357546518,1732357546518);
INSERT INTO Permission VALUES('cm3u0ydqu003i6lkhxv2k82ml','update','user_contributor','own','',1732357546519,1732357546519);
INSERT INTO Permission VALUES('cm3u0ydqu003j6lkhvadw4sf4','update','user_contributor','any','',1732357546519,1732357546519);
INSERT INTO Permission VALUES('cm3u0ydqv003k6lkhcev0mny7','update_role','user_contributor','own','',1732357546519,1732357546519);
INSERT INTO Permission VALUES('cm3u0ydqv003l6lkhd6g5qb7p','update_role','user_contributor','any','',1732357546520,1732357546520);
INSERT INTO Permission VALUES('cm3u0ydqw003m6lkhmu3qssvt','delete','user_contributor','own','',1732357546520,1732357546520);
INSERT INTO Permission VALUES('cm3u0ydqw003n6lkh96ooe476','delete','user_contributor','any','',1732357546521,1732357546521);

INSERT INTO _PermissionToRole VALUES('cm3u0ydop00016lkh34vzjzbk','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydow000b6lkh83tyumyf','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydoq00036lkhrsmg0xb1','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydos00056lkhc1h6t9ne','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydot00076lkhwo364yf2','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydoo00006lkhc23zz4ll','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydov000a6lkhh7w8uvri','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydoq00026lkhkk96tc2c','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydor00046lkhj1vp0p0u','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydos00066lkh8ts4171g','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydox000d6lkhi9yzi3f0','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydp3000n6lkh5b37yu59','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydp0000h6lkhl9v1wb0f','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydp1000j6lkhxaz8q25o','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydox000c6lkh7xq4dhgr','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydp3000m6lkhicwazjob','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydoz000g6lkh208gw3hi','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydp1000i6lkhz93iz1uw','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydp4000p6lkh2pexx7bf','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpa000z6lkhhey1axb3','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydp7000t6lkhhcdn3wbl','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydp8000v6lkhdcnyiuih','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydp4000o6lkh235g6g7h','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydp9000y6lkh30j3mx3i','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydp6000s6lkhttovk7su','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydp7000u6lkhjm9esu15','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpb00116lkhkpztsycd','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpi001b6lkhjj3rbfz8','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpc00136lkhjvfj6w3t','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpd00156lkhej8xq80i','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpf00176lkhts8nyk9p','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpb00106lkhs3lj93de','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydph001a6lkhcw723ehj','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpc00126lkhq5zgz1b7','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpd00146lkhmwpiymg7','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpe00166lkh6oc9txdn','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpk001d6lkh3rn2zjq7','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpr001n6lkhao2qepcj','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpm001f6lkhue92xnny','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpn001h6lkh3fs863pe','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpo001j6lkhfcpi6t47','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpj001c6lkhgkmpjqy3','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpq001m6lkhj9x9mr1u','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpl001e6lkhpt4loc4c','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpm001g6lkhdr5wvk2e','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpn001i6lkh8phwtrcs','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpt001p6lkhfjnw5ufa','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpy001z6lkh5413jjzx','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpv001t6lkh48g5hmfe','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpw001v6lkh3rgt40tz','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydps001o6lkh02kg2p8h','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpy001y6lkhhrlz5bxg','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpv001s6lkhtv2u38cy','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpw001u6lkhf8x0of5d','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydq200256lkhkxo05ibx','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydq300276lkhgu9ejbex','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydq100246lkh3tkhy5jt','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydq200266lkhq54uhle8','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydq7002d6lkhtpe6n4r4','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqd002n6lkhmlhxwlrh','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqa002h6lkhlxhm69ii','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqb002j6lkho5m1oqpi','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqc002l6lkhvsy55or0','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydq6002c6lkhw7em86mb','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqd002m6lkhuubm0izw','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydq9002g6lkhmsoqy2xi','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqa002i6lkh7mm46fgd','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqb002k6lkh38861h48','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqf002p6lkhqgvy1qnd','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqk002z6lkh6cqlvi0w','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqh002t6lkh3p9bhjoz','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqi002v6lkhorr2tvmt','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqj002x6lkh1t66d9bn','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqe002o6lkheoqa2xbc','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqj002y6lkhz6sar1b7','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqg002s6lkhom67zpvi','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqh002u6lkh4nk9c2gv','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqi002w6lkhrjhlxko9','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydql00316lkhxoskaoj0','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqr003b6lkhpb3b10hw','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqo00356lkhmj7wg2gg','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqp00376lkhlyotlvky','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqq00396lkh1f7gjb9x','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqk00306lkh4rjmtomz','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqq003a6lkht1khn8oq','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqn00346lkh6svkxwgs','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqo00366lkhbvuply3r','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqp00386lkh4t3fpz5d','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqs003d6lkhfk9v8dzq','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqw003n6lkh96ooe476','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqu003h6lkhub8oo9mm','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqu003j6lkhvadw4sf4','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqv003l6lkhd6g5qb7p','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqr003c6lkhp2akf5z9','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqw003m6lkhmu3qssvt','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqt003g6lkh0wq9enjn','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqu003i6lkhxv2k82ml','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqv003k6lkhcev0mny7','cm3u0ydr1003o6lkhn6nd42rw');
INSERT INTO _PermissionToRole VALUES('cm3u0ydop00016lkh34vzjzbk','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydow000b6lkh83tyumyf','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydoq00036lkhrsmg0xb1','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydos00056lkhc1h6t9ne','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydot00076lkhwo364yf2','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydoo00006lkhc23zz4ll','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydov000a6lkhh7w8uvri','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydoq00026lkhkk96tc2c','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydor00046lkhj1vp0p0u','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydos00066lkh8ts4171g','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydox000d6lkhi9yzi3f0','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydp3000n6lkh5b37yu59','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydp0000h6lkhl9v1wb0f','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydp1000j6lkhxaz8q25o','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydox000c6lkh7xq4dhgr','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydp3000m6lkhicwazjob','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydoz000g6lkh208gw3hi','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydp1000i6lkhz93iz1uw','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydp4000p6lkh2pexx7bf','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpa000z6lkhhey1axb3','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydp7000t6lkhhcdn3wbl','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydp8000v6lkhdcnyiuih','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydp4000o6lkh235g6g7h','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydp9000y6lkh30j3mx3i','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydp6000s6lkhttovk7su','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydp7000u6lkhjm9esu15','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpb00116lkhkpztsycd','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpi001b6lkhjj3rbfz8','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpc00136lkhjvfj6w3t','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpd00156lkhej8xq80i','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpf00176lkhts8nyk9p','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpb00106lkhs3lj93de','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydph001a6lkhcw723ehj','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpc00126lkhq5zgz1b7','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpd00146lkhmwpiymg7','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpe00166lkh6oc9txdn','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpk001d6lkh3rn2zjq7','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpr001n6lkhao2qepcj','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpm001f6lkhue92xnny','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpn001h6lkh3fs863pe','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpo001j6lkhfcpi6t47','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpj001c6lkhgkmpjqy3','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpq001m6lkhj9x9mr1u','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpl001e6lkhpt4loc4c','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpm001g6lkhdr5wvk2e','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpn001i6lkh8phwtrcs','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpt001p6lkhfjnw5ufa','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpy001z6lkh5413jjzx','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpv001t6lkh48g5hmfe','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpw001v6lkh3rgt40tz','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydps001o6lkh02kg2p8h','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpy001y6lkhhrlz5bxg','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpv001s6lkhtv2u38cy','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpw001u6lkhf8x0of5d','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqa002h6lkhlxhm69ii','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqb002j6lkho5m1oqpi','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydq9002g6lkhmsoqy2xi','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqa002i6lkh7mm46fgd','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqf002p6lkhqgvy1qnd','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqk002z6lkh6cqlvi0w','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqh002t6lkh3p9bhjoz','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqi002v6lkhorr2tvmt','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqj002x6lkh1t66d9bn','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqe002o6lkheoqa2xbc','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqj002y6lkhz6sar1b7','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqg002s6lkhom67zpvi','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqh002u6lkh4nk9c2gv','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqi002w6lkhrjhlxko9','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydql00316lkhxoskaoj0','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqr003b6lkhpb3b10hw','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqo00356lkhmj7wg2gg','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqp00376lkhlyotlvky','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqq00396lkh1f7gjb9x','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqk00306lkh4rjmtomz','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqq003a6lkht1khn8oq','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqn00346lkh6svkxwgs','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqo00366lkhbvuply3r','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqp00386lkh4t3fpz5d','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqs003d6lkhfk9v8dzq','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqw003n6lkh96ooe476','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqu003h6lkhub8oo9mm','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqu003j6lkhvadw4sf4','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqv003l6lkhd6g5qb7p','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqr003c6lkhp2akf5z9','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqw003m6lkhmu3qssvt','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqt003g6lkh0wq9enjn','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqu003i6lkhxv2k82ml','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydqv003k6lkhcev0mny7','cm3u0ydrd003p6lkh88cgmdne');
INSERT INTO _PermissionToRole VALUES('cm3u0ydop00016lkh34vzjzbk','cm3u0ydrn003q6lkhbc0gjizr');
INSERT INTO _PermissionToRole VALUES('cm3u0ydoq00036lkhrsmg0xb1','cm3u0ydrn003q6lkhbc0gjizr');
INSERT INTO _PermissionToRole VALUES('cm3u0ydos00056lkhc1h6t9ne','cm3u0ydrn003q6lkhbc0gjizr');
INSERT INTO _PermissionToRole VALUES('cm3u0ydot00076lkhwo364yf2','cm3u0ydrn003q6lkhbc0gjizr');
INSERT INTO _PermissionToRole VALUES('cm3u0ydoo00006lkhc23zz4ll','cm3u0ydrn003q6lkhbc0gjizr');
INSERT INTO _PermissionToRole VALUES('cm3u0ydoq00026lkhkk96tc2c','cm3u0ydrn003q6lkhbc0gjizr');
INSERT INTO _PermissionToRole VALUES('cm3u0ydor00046lkhj1vp0p0u','cm3u0ydrn003q6lkhbc0gjizr');
INSERT INTO _PermissionToRole VALUES('cm3u0ydos00066lkh8ts4171g','cm3u0ydrn003q6lkhbc0gjizr');
INSERT INTO _PermissionToRole VALUES('cm3u0ydox000d6lkhi9yzi3f0','cm3u0ydrn003q6lkhbc0gjizr');
INSERT INTO _PermissionToRole VALUES('cm3u0ydp0000h6lkhl9v1wb0f','cm3u0ydrn003q6lkhbc0gjizr');
INSERT INTO _PermissionToRole VALUES('cm3u0ydp1000j6lkhxaz8q25o','cm3u0ydrn003q6lkhbc0gjizr');
INSERT INTO _PermissionToRole VALUES('cm3u0ydox000c6lkh7xq4dhgr','cm3u0ydrn003q6lkhbc0gjizr');
INSERT INTO _PermissionToRole VALUES('cm3u0ydoz000g6lkh208gw3hi','cm3u0ydrn003q6lkhbc0gjizr');
INSERT INTO _PermissionToRole VALUES('cm3u0ydp1000i6lkhz93iz1uw','cm3u0ydrn003q6lkhbc0gjizr');
INSERT INTO _PermissionToRole VALUES('cm3u0ydp4000p6lkh2pexx7bf','cm3u0ydrn003q6lkhbc0gjizr');
INSERT INTO _PermissionToRole VALUES('cm3u0ydp7000t6lkhhcdn3wbl','cm3u0ydrn003q6lkhbc0gjizr');
INSERT INTO _PermissionToRole VALUES('cm3u0ydp8000v6lkhdcnyiuih','cm3u0ydrn003q6lkhbc0gjizr');
INSERT INTO _PermissionToRole VALUES('cm3u0ydp4000o6lkh235g6g7h','cm3u0ydrn003q6lkhbc0gjizr');
INSERT INTO _PermissionToRole VALUES('cm3u0ydp6000s6lkhttovk7su','cm3u0ydrn003q6lkhbc0gjizr');
INSERT INTO _PermissionToRole VALUES('cm3u0ydp7000u6lkhjm9esu15','cm3u0ydrn003q6lkhbc0gjizr');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpb00116lkhkpztsycd','cm3u0ydrn003q6lkhbc0gjizr');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpc00136lkhjvfj6w3t','cm3u0ydrn003q6lkhbc0gjizr');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpd00156lkhej8xq80i','cm3u0ydrn003q6lkhbc0gjizr');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpf00176lkhts8nyk9p','cm3u0ydrn003q6lkhbc0gjizr');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpb00106lkhs3lj93de','cm3u0ydrn003q6lkhbc0gjizr');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpc00126lkhq5zgz1b7','cm3u0ydrn003q6lkhbc0gjizr');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpd00146lkhmwpiymg7','cm3u0ydrn003q6lkhbc0gjizr');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpe00166lkh6oc9txdn','cm3u0ydrn003q6lkhbc0gjizr');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpk001d6lkh3rn2zjq7','cm3u0ydrn003q6lkhbc0gjizr');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpm001f6lkhue92xnny','cm3u0ydrn003q6lkhbc0gjizr');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpn001h6lkh3fs863pe','cm3u0ydrn003q6lkhbc0gjizr');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpo001j6lkhfcpi6t47','cm3u0ydrn003q6lkhbc0gjizr');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpj001c6lkhgkmpjqy3','cm3u0ydrn003q6lkhbc0gjizr');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpl001e6lkhpt4loc4c','cm3u0ydrn003q6lkhbc0gjizr');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpm001g6lkhdr5wvk2e','cm3u0ydrn003q6lkhbc0gjizr');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpn001i6lkh8phwtrcs','cm3u0ydrn003q6lkhbc0gjizr');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpt001p6lkhfjnw5ufa','cm3u0ydrn003q6lkhbc0gjizr');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpu001r6lkh7h4ajgw2','cm3u0ydrn003q6lkhbc0gjizr');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpv001t6lkh48g5hmfe','cm3u0ydrn003q6lkhbc0gjizr');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpw001v6lkh3rgt40tz','cm3u0ydrn003q6lkhbc0gjizr');
INSERT INTO _PermissionToRole VALUES('cm3u0ydps001o6lkh02kg2p8h','cm3u0ydrn003q6lkhbc0gjizr');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpu001q6lkh8o235psq','cm3u0ydrn003q6lkhbc0gjizr');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpv001s6lkhtv2u38cy','cm3u0ydrn003q6lkhbc0gjizr');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpw001u6lkhf8x0of5d','cm3u0ydrn003q6lkhbc0gjizr');
INSERT INTO _PermissionToRole VALUES('cm3u0ydos00056lkhc1h6t9ne','cm3u0ydrz003r6lkh0gezs9nn');
INSERT INTO _PermissionToRole VALUES('cm3u0ydoo00006lkhc23zz4ll','cm3u0ydrz003r6lkh0gezs9nn');
INSERT INTO _PermissionToRole VALUES('cm3u0ydoq00026lkhkk96tc2c','cm3u0ydrz003r6lkh0gezs9nn');
INSERT INTO _PermissionToRole VALUES('cm3u0ydor00046lkhj1vp0p0u','cm3u0ydrz003r6lkh0gezs9nn');
INSERT INTO _PermissionToRole VALUES('cm3u0ydos00066lkh8ts4171g','cm3u0ydrz003r6lkh0gezs9nn');
INSERT INTO _PermissionToRole VALUES('cm3u0ydp0000h6lkhl9v1wb0f','cm3u0ydrz003r6lkh0gezs9nn');
INSERT INTO _PermissionToRole VALUES('cm3u0ydox000c6lkh7xq4dhgr','cm3u0ydrz003r6lkh0gezs9nn');
INSERT INTO _PermissionToRole VALUES('cm3u0ydoz000g6lkh208gw3hi','cm3u0ydrz003r6lkh0gezs9nn');
INSERT INTO _PermissionToRole VALUES('cm3u0ydp1000i6lkhz93iz1uw','cm3u0ydrz003r6lkh0gezs9nn');
INSERT INTO _PermissionToRole VALUES('cm3u0ydp7000t6lkhhcdn3wbl','cm3u0ydrz003r6lkh0gezs9nn');
INSERT INTO _PermissionToRole VALUES('cm3u0ydp4000o6lkh235g6g7h','cm3u0ydrz003r6lkh0gezs9nn');
INSERT INTO _PermissionToRole VALUES('cm3u0ydp6000s6lkhttovk7su','cm3u0ydrz003r6lkh0gezs9nn');
INSERT INTO _PermissionToRole VALUES('cm3u0ydp7000u6lkhjm9esu15','cm3u0ydrz003r6lkh0gezs9nn');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpd00156lkhej8xq80i','cm3u0ydrz003r6lkh0gezs9nn');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpb00106lkhs3lj93de','cm3u0ydrz003r6lkh0gezs9nn');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpc00126lkhq5zgz1b7','cm3u0ydrz003r6lkh0gezs9nn');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpd00146lkhmwpiymg7','cm3u0ydrz003r6lkh0gezs9nn');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpe00166lkh6oc9txdn','cm3u0ydrz003r6lkh0gezs9nn');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpn001h6lkh3fs863pe','cm3u0ydrz003r6lkh0gezs9nn');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpj001c6lkhgkmpjqy3','cm3u0ydrz003r6lkh0gezs9nn');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpl001e6lkhpt4loc4c','cm3u0ydrz003r6lkh0gezs9nn');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpm001g6lkhdr5wvk2e','cm3u0ydrz003r6lkh0gezs9nn');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpn001i6lkh8phwtrcs','cm3u0ydrz003r6lkh0gezs9nn');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpv001t6lkh48g5hmfe','cm3u0ydrz003r6lkh0gezs9nn');
INSERT INTO _PermissionToRole VALUES('cm3u0ydps001o6lkh02kg2p8h','cm3u0ydrz003r6lkh0gezs9nn');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpu001q6lkh8o235psq','cm3u0ydrz003r6lkh0gezs9nn');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpv001s6lkhtv2u38cy','cm3u0ydrz003r6lkh0gezs9nn');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpw001u6lkhf8x0of5d','cm3u0ydrz003r6lkh0gezs9nn');
INSERT INTO _PermissionToRole VALUES('cm3u0ydos00056lkhc1h6t9ne','cm3u0yds4003s6lkhn1hfgqgm');
INSERT INTO _PermissionToRole VALUES('cm3u0ydoo00006lkhc23zz4ll','cm3u0yds4003s6lkhn1hfgqgm');
INSERT INTO _PermissionToRole VALUES('cm3u0ydor00046lkhj1vp0p0u','cm3u0yds4003s6lkhn1hfgqgm');
INSERT INTO _PermissionToRole VALUES('cm3u0ydos00066lkh8ts4171g','cm3u0yds4003s6lkhn1hfgqgm');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpd00156lkhej8xq80i','cm3u0yds4003s6lkhn1hfgqgm');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpb00106lkhs3lj93de','cm3u0yds4003s6lkhn1hfgqgm');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpd00146lkhmwpiymg7','cm3u0yds4003s6lkhn1hfgqgm');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpe00166lkh6oc9txdn','cm3u0yds4003s6lkhn1hfgqgm');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpn001h6lkh3fs863pe','cm3u0yds4003s6lkhn1hfgqgm');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpj001c6lkhgkmpjqy3','cm3u0yds4003s6lkhn1hfgqgm');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpm001g6lkhdr5wvk2e','cm3u0yds4003s6lkhn1hfgqgm');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpn001i6lkh8phwtrcs','cm3u0yds4003s6lkhn1hfgqgm');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpv001t6lkh48g5hmfe','cm3u0yds4003s6lkhn1hfgqgm');
INSERT INTO _PermissionToRole VALUES('cm3u0ydps001o6lkh02kg2p8h','cm3u0yds4003s6lkhn1hfgqgm');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpv001s6lkhtv2u38cy','cm3u0yds4003s6lkhn1hfgqgm');
INSERT INTO _PermissionToRole VALUES('cm3u0ydpw001u6lkhf8x0of5d','cm3u0yds4003s6lkhn1hfgqgm');
PRAGMA foreign_keys=ON;