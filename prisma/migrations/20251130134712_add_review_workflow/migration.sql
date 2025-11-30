-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Article" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "Article_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Article_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Article" ("authorId", "content", "createdAt", "id", "publishedAt", "slug", "state", "title", "updatedAt") SELECT "authorId", "content", "createdAt", "id", "publishedAt", "slug", "state", "title", "updatedAt" FROM "Article";
DROP TABLE "Article";
ALTER TABLE "new_Article" RENAME TO "Article";
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");
CREATE INDEX "Article_authorId_idx" ON "Article"("authorId");
CREATE INDEX "Article_reviewedById_idx" ON "Article"("reviewedById");
CREATE TABLE "new_ArticleCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "ArticleCategory_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ArticleCategory_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ArticleCategory" ("authorId", "createdAt", "id", "name", "publishedAt", "slug", "state", "updatedAt") SELECT "authorId", "createdAt", "id", "name", "publishedAt", "slug", "state", "updatedAt" FROM "ArticleCategory";
DROP TABLE "ArticleCategory";
ALTER TABLE "new_ArticleCategory" RENAME TO "ArticleCategory";
CREATE UNIQUE INDEX "ArticleCategory_name_key" ON "ArticleCategory"("name");
CREATE UNIQUE INDEX "ArticleCategory_slug_key" ON "ArticleCategory"("slug");
CREATE INDEX "ArticleCategory_authorId_idx" ON "ArticleCategory"("authorId");
CREATE INDEX "ArticleCategory_reviewedById_idx" ON "ArticleCategory"("reviewedById");
CREATE TABLE "new_ArticleTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "ArticleTag_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ArticleTag_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ArticleTag" ("authorId", "createdAt", "id", "name", "publishedAt", "slug", "state", "updatedAt") SELECT "authorId", "createdAt", "id", "name", "publishedAt", "slug", "state", "updatedAt" FROM "ArticleTag";
DROP TABLE "ArticleTag";
ALTER TABLE "new_ArticleTag" RENAME TO "ArticleTag";
CREATE UNIQUE INDEX "ArticleTag_name_key" ON "ArticleTag"("name");
CREATE UNIQUE INDEX "ArticleTag_slug_key" ON "ArticleTag"("slug");
CREATE INDEX "ArticleTag_authorId_idx" ON "ArticleTag"("authorId");
CREATE INDEX "ArticleTag_reviewedById_idx" ON "ArticleTag"("reviewedById");
CREATE TABLE "new_Issue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "releasedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "Issue_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Issue_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Issue" ("authorId", "createdAt", "id", "label", "publishedAt", "releasedAt", "state", "updatedAt") SELECT "authorId", "createdAt", "id", "label", "publishedAt", "releasedAt", "state", "updatedAt" FROM "Issue";
DROP TABLE "Issue";
ALTER TABLE "new_Issue" RENAME TO "Issue";
CREATE INDEX "Issue_authorId_idx" ON "Issue"("authorId");
CREATE INDEX "Issue_reviewedById_idx" ON "Issue"("reviewedById");
CREATE TABLE "new_Podcast" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "Podcast_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Podcast_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Podcast" ("authorId", "createdAt", "description", "id", "publishedAt", "slug", "state", "title", "updatedAt") SELECT "authorId", "createdAt", "description", "id", "publishedAt", "slug", "state", "title", "updatedAt" FROM "Podcast";
DROP TABLE "Podcast";
ALTER TABLE "new_Podcast" RENAME TO "Podcast";
CREATE UNIQUE INDEX "Podcast_slug_key" ON "Podcast"("slug");
CREATE INDEX "Podcast_authorId_idx" ON "Podcast"("authorId");
CREATE INDEX "Podcast_reviewedById_idx" ON "Podcast"("reviewedById");
CREATE TABLE "new_PodcastEpisode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "podcastId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "PodcastEpisode_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PodcastEpisode_podcastId_fkey" FOREIGN KEY ("podcastId") REFERENCES "Podcast" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PodcastEpisode_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PodcastEpisode" ("authorId", "createdAt", "description", "id", "number", "podcastId", "publishedAt", "slug", "state", "title", "updatedAt") SELECT "authorId", "createdAt", "description", "id", "number", "podcastId", "publishedAt", "slug", "state", "title", "updatedAt" FROM "PodcastEpisode";
DROP TABLE "PodcastEpisode";
ALTER TABLE "new_PodcastEpisode" RENAME TO "PodcastEpisode";
CREATE UNIQUE INDEX "PodcastEpisode_slug_key" ON "PodcastEpisode"("slug");
CREATE INDEX "PodcastEpisode_podcastId_idx" ON "PodcastEpisode"("podcastId");
CREATE INDEX "PodcastEpisode_authorId_idx" ON "PodcastEpisode"("authorId");
CREATE INDEX "PodcastEpisode_reviewedById_idx" ON "PodcastEpisode"("reviewedById");
CREATE UNIQUE INDEX "PodcastEpisode_podcastId_number_key" ON "PodcastEpisode"("podcastId", "number");
CREATE TABLE "new_PodcastEpisodeLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "publishedAt" DATETIME,
    "state" TEXT NOT NULL DEFAULT 'draft',
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "episodeId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "PodcastEpisodeLink_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PodcastEpisodeLink_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "PodcastEpisode" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PodcastEpisodeLink_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PodcastEpisodeLink" ("authorId", "createdAt", "episodeId", "id", "label", "publishedAt", "state", "updatedAt", "url") SELECT "authorId", "createdAt", "episodeId", "id", "label", "publishedAt", "state", "updatedAt", "url" FROM "PodcastEpisodeLink";
DROP TABLE "PodcastEpisodeLink";
ALTER TABLE "new_PodcastEpisodeLink" RENAME TO "PodcastEpisodeLink";
CREATE INDEX "PodcastEpisodeLink_episodeId_idx" ON "PodcastEpisodeLink"("episodeId");
CREATE INDEX "PodcastEpisodeLink_authorId_idx" ON "PodcastEpisodeLink"("authorId");
CREATE INDEX "PodcastEpisodeLink_reviewedById_idx" ON "PodcastEpisodeLink"("reviewedById");

-- Step 1: Clear existing permission data
DELETE FROM _AuthorPermissionToAuthorRole;
DELETE FROM AuthorPermission;

-- Step 2: Insert new permissions
INSERT INTO AuthorPermission VALUES('cmilsxzsh000gz270r6gpi80z','view','article','own','draft','','2025-11-30T14:14:57.137+00:00','2025-11-30T14:14:57.137+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzsi000hz270mwe8c9mo','create','article','own','draft','','2025-11-30T14:14:57.138+00:00','2025-11-30T14:14:57.138+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzsk000iz270rqqm3h8n','update','article','own','draft','','2025-11-30T14:14:57.140+00:00','2025-11-30T14:14:57.140+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzsl000jz270zhhvaart','delete','article','own','draft','','2025-11-30T14:14:57.141+00:00','2025-11-30T14:14:57.141+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzsm000kz270mho6av7q','publish','article','own','draft','','2025-11-30T14:14:57.142+00:00','2025-11-30T14:14:57.142+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzsm000lz270jya2om01','retract','article','own','draft','','2025-11-30T14:14:57.142+00:00','2025-11-30T14:14:57.142+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzsn000mz270ijwo8s4c','archive','article','own','draft','','2025-11-30T14:14:57.143+00:00','2025-11-30T14:14:57.143+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzso000nz270a2hms2jr','restore','article','own','draft','','2025-11-30T14:14:57.144+00:00','2025-11-30T14:14:57.144+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzsp000oz27076t0wf35','review','article','own','draft','','2025-11-30T14:14:57.145+00:00','2025-11-30T14:14:57.145+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzsp000pz270sbirjf3k','view','article','any','draft','','2025-11-30T14:14:57.145+00:00','2025-11-30T14:14:57.145+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzsq000qz270bfz6y91f','create','article','any','draft','','2025-11-30T14:14:57.146+00:00','2025-11-30T14:14:57.146+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzsr000rz270lueqoo4j','update','article','any','draft','','2025-11-30T14:14:57.147+00:00','2025-11-30T14:14:57.147+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzss000sz270zt5bunxq','delete','article','any','draft','','2025-11-30T14:14:57.148+00:00','2025-11-30T14:14:57.148+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzst000tz270dsuyk220','publish','article','any','draft','','2025-11-30T14:14:57.149+00:00','2025-11-30T14:14:57.149+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzsv000uz270xege5dgb','retract','article','any','draft','','2025-11-30T14:14:57.151+00:00','2025-11-30T14:14:57.151+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzsx000vz2701c6og9h2','archive','article','any','draft','','2025-11-30T14:14:57.153+00:00','2025-11-30T14:14:57.153+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzsy000wz270227h82rt','restore','article','any','draft','','2025-11-30T14:14:57.154+00:00','2025-11-30T14:14:57.154+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzsz000xz270qzwdl98k','review','article','any','draft','','2025-11-30T14:14:57.155+00:00','2025-11-30T14:14:57.155+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzt0000yz270ippn1n0c','view','article','own','published','','2025-11-30T14:14:57.156+00:00','2025-11-30T14:14:57.156+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzt1000zz27020vxur71','create','article','own','published','','2025-11-30T14:14:57.157+00:00','2025-11-30T14:14:57.157+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzt20010z270um292ctx','update','article','own','published','','2025-11-30T14:14:57.158+00:00','2025-11-30T14:14:57.158+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzt30011z2706n3bgpq4','delete','article','own','published','','2025-11-30T14:14:57.159+00:00','2025-11-30T14:14:57.159+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzt40012z270dlq9vkes','publish','article','own','published','','2025-11-30T14:14:57.160+00:00','2025-11-30T14:14:57.160+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzt50013z270fq65yiio','retract','article','own','published','','2025-11-30T14:14:57.161+00:00','2025-11-30T14:14:57.161+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzt60014z2703v4loxf3','archive','article','own','published','','2025-11-30T14:14:57.162+00:00','2025-11-30T14:14:57.162+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzt70015z270bucgq2zi','restore','article','own','published','','2025-11-30T14:14:57.163+00:00','2025-11-30T14:14:57.163+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzt80016z270dj0auohw','review','article','own','published','','2025-11-30T14:14:57.164+00:00','2025-11-30T14:14:57.164+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzt90017z270xsua59du','view','article','any','published','','2025-11-30T14:14:57.165+00:00','2025-11-30T14:14:57.165+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzt90018z270mwy9tyy3','create','article','any','published','','2025-11-30T14:14:57.165+00:00','2025-11-30T14:14:57.165+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzta0019z270r00ucpeg','update','article','any','published','','2025-11-30T14:14:57.166+00:00','2025-11-30T14:14:57.166+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxztb001az2709apem3xr','delete','article','any','published','','2025-11-30T14:14:57.167+00:00','2025-11-30T14:14:57.167+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxztc001bz2709kqvicfk','publish','article','any','published','','2025-11-30T14:14:57.168+00:00','2025-11-30T14:14:57.168+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxztd001cz2706cchkh3t','retract','article','any','published','','2025-11-30T14:14:57.169+00:00','2025-11-30T14:14:57.169+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxztd001dz270dbu0bqht','archive','article','any','published','','2025-11-30T14:14:57.169+00:00','2025-11-30T14:14:57.169+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzte001ez270m96wpw6k','restore','article','any','published','','2025-11-30T14:14:57.170+00:00','2025-11-30T14:14:57.170+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxztf001fz270h242w7tq','review','article','any','published','','2025-11-30T14:14:57.171+00:00','2025-11-30T14:14:57.171+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxztg001gz270e7q72lym','view','article','own','archived','','2025-11-30T14:14:57.172+00:00','2025-11-30T14:14:57.172+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzth001hz27004slg3ge','create','article','own','archived','','2025-11-30T14:14:57.173+00:00','2025-11-30T14:14:57.173+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzti001iz270l3wmoyl4','update','article','own','archived','','2025-11-30T14:14:57.174+00:00','2025-11-30T14:14:57.174+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxztj001jz270wsbnhfc7','delete','article','own','archived','','2025-11-30T14:14:57.175+00:00','2025-11-30T14:14:57.175+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxztk001kz2703bz2lo2p','publish','article','own','archived','','2025-11-30T14:14:57.176+00:00','2025-11-30T14:14:57.176+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxztl001lz270gakt1cjl','retract','article','own','archived','','2025-11-30T14:14:57.177+00:00','2025-11-30T14:14:57.177+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxztm001mz270mu4s4euz','archive','article','own','archived','','2025-11-30T14:14:57.178+00:00','2025-11-30T14:14:57.178+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxztm001nz2705sfemtk9','restore','article','own','archived','','2025-11-30T14:14:57.178+00:00','2025-11-30T14:14:57.178+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxztn001oz270ncmdyxeo','review','article','own','archived','','2025-11-30T14:14:57.179+00:00','2025-11-30T14:14:57.179+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzto001pz270eh3few1w','view','article','any','archived','','2025-11-30T14:14:57.180+00:00','2025-11-30T14:14:57.180+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzto001qz270azdufweo','create','article','any','archived','','2025-11-30T14:14:57.180+00:00','2025-11-30T14:14:57.180+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxztp001rz27052fq3593','update','article','any','archived','','2025-11-30T14:14:57.181+00:00','2025-11-30T14:14:57.181+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxztq001sz270vy0r7av1','delete','article','any','archived','','2025-11-30T14:14:57.182+00:00','2025-11-30T14:14:57.182+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzts001tz270j2qu3wpy','publish','article','any','archived','','2025-11-30T14:14:57.184+00:00','2025-11-30T14:14:57.184+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzts001uz270o5hn7wl2','retract','article','any','archived','','2025-11-30T14:14:57.184+00:00','2025-11-30T14:14:57.184+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxztt001vz270mc4qoayi','archive','article','any','archived','','2025-11-30T14:14:57.185+00:00','2025-11-30T14:14:57.185+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxztu001wz2702f94zna0','restore','article','any','archived','','2025-11-30T14:14:57.186+00:00','2025-11-30T14:14:57.186+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxztv001xz2700v8cz2ed','review','article','any','archived','','2025-11-30T14:14:57.187+00:00','2025-11-30T14:14:57.187+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxztv001yz270vjuygpam','view','article_category','own','draft','','2025-11-30T14:14:57.187+00:00','2025-11-30T14:14:57.187+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxztw001zz270ts0w6xd7','create','article_category','own','draft','','2025-11-30T14:14:57.188+00:00','2025-11-30T14:14:57.188+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxztx0020z2701nqtp7xq','update','article_category','own','draft','','2025-11-30T14:14:57.189+00:00','2025-11-30T14:14:57.189+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxztx0021z2704bnrkgy9','delete','article_category','own','draft','','2025-11-30T14:14:57.189+00:00','2025-11-30T14:14:57.189+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzty0022z270dgqw18yv','publish','article_category','own','draft','','2025-11-30T14:14:57.190+00:00','2025-11-30T14:14:57.190+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxztz0023z270tft5l086','retract','article_category','own','draft','','2025-11-30T14:14:57.191+00:00','2025-11-30T14:14:57.191+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxztz0024z270bpy12r5u','archive','article_category','own','draft','','2025-11-30T14:14:57.191+00:00','2025-11-30T14:14:57.191+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzu00025z270iuqfzn9y','restore','article_category','own','draft','','2025-11-30T14:14:57.192+00:00','2025-11-30T14:14:57.192+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzu10026z2705wehdup6','review','article_category','own','draft','','2025-11-30T14:14:57.193+00:00','2025-11-30T14:14:57.193+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzu10027z27091k1uaha','view','article_category','any','draft','','2025-11-30T14:14:57.193+00:00','2025-11-30T14:14:57.193+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzu20028z27080bwdn3g','create','article_category','any','draft','','2025-11-30T14:14:57.194+00:00','2025-11-30T14:14:57.194+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzu30029z270x6am9a19','update','article_category','any','draft','','2025-11-30T14:14:57.195+00:00','2025-11-30T14:14:57.195+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzu3002az270fsel70qh','delete','article_category','any','draft','','2025-11-30T14:14:57.195+00:00','2025-11-30T14:14:57.195+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzu5002bz270bdem138v','publish','article_category','any','draft','','2025-11-30T14:14:57.197+00:00','2025-11-30T14:14:57.197+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzu6002cz270w30wumha','retract','article_category','any','draft','','2025-11-30T14:14:57.198+00:00','2025-11-30T14:14:57.198+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzu6002dz270vw2ras61','archive','article_category','any','draft','','2025-11-30T14:14:57.198+00:00','2025-11-30T14:14:57.198+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzu7002ez270bj5607mm','restore','article_category','any','draft','','2025-11-30T14:14:57.199+00:00','2025-11-30T14:14:57.199+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzu8002fz270fd8sccbh','review','article_category','any','draft','','2025-11-30T14:14:57.200+00:00','2025-11-30T14:14:57.200+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzu8002gz270w7wmhxw8','view','article_category','own','published','','2025-11-30T14:14:57.200+00:00','2025-11-30T14:14:57.200+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzu9002hz2703sjf35di','create','article_category','own','published','','2025-11-30T14:14:57.201+00:00','2025-11-30T14:14:57.201+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzu9002iz270q6jxzb4p','update','article_category','own','published','','2025-11-30T14:14:57.201+00:00','2025-11-30T14:14:57.201+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzua002jz2709nu9rnbk','delete','article_category','own','published','','2025-11-30T14:14:57.202+00:00','2025-11-30T14:14:57.202+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzub002kz2708rlh5l8h','publish','article_category','own','published','','2025-11-30T14:14:57.203+00:00','2025-11-30T14:14:57.203+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzub002lz270xdpwneup','retract','article_category','own','published','','2025-11-30T14:14:57.203+00:00','2025-11-30T14:14:57.203+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzuc002mz2709b9jff7m','archive','article_category','own','published','','2025-11-30T14:14:57.204+00:00','2025-11-30T14:14:57.204+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzud002nz270q6p4hz9d','restore','article_category','own','published','','2025-11-30T14:14:57.205+00:00','2025-11-30T14:14:57.205+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzud002oz270x876adly','review','article_category','own','published','','2025-11-30T14:14:57.205+00:00','2025-11-30T14:14:57.205+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzue002pz270x9f2y2l7','view','article_category','any','published','','2025-11-30T14:14:57.206+00:00','2025-11-30T14:14:57.206+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzuf002qz270vwv5y0xy','create','article_category','any','published','','2025-11-30T14:14:57.207+00:00','2025-11-30T14:14:57.207+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzug002rz270dc3schfx','update','article_category','any','published','','2025-11-30T14:14:57.208+00:00','2025-11-30T14:14:57.208+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzug002sz270q8706e9h','delete','article_category','any','published','','2025-11-30T14:14:57.208+00:00','2025-11-30T14:14:57.208+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzuh002tz270eow8y6l5','publish','article_category','any','published','','2025-11-30T14:14:57.209+00:00','2025-11-30T14:14:57.209+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzuh002uz270yoi0o5lm','retract','article_category','any','published','','2025-11-30T14:14:57.209+00:00','2025-11-30T14:14:57.209+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzui002vz270febvz38a','archive','article_category','any','published','','2025-11-30T14:14:57.210+00:00','2025-11-30T14:14:57.210+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzuj002wz2708fe8w394','restore','article_category','any','published','','2025-11-30T14:14:57.211+00:00','2025-11-30T14:14:57.211+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzuj002xz270o3vd0u3q','review','article_category','any','published','','2025-11-30T14:14:57.211+00:00','2025-11-30T14:14:57.211+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzuk002yz270zmzd10nu','view','article_category','own','archived','','2025-11-30T14:14:57.212+00:00','2025-11-30T14:14:57.212+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzul002zz2705ecs3qr6','create','article_category','own','archived','','2025-11-30T14:14:57.213+00:00','2025-11-30T14:14:57.213+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzul0030z270mk8na6uf','update','article_category','own','archived','','2025-11-30T14:14:57.213+00:00','2025-11-30T14:14:57.213+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzun0031z270tig9x7cy','delete','article_category','own','archived','','2025-11-30T14:14:57.215+00:00','2025-11-30T14:14:57.215+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzuo0032z270jl3jmqab','publish','article_category','own','archived','','2025-11-30T14:14:57.216+00:00','2025-11-30T14:14:57.216+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzup0033z270fbqzbmsl','retract','article_category','own','archived','','2025-11-30T14:14:57.217+00:00','2025-11-30T14:14:57.217+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzuq0034z270d0i7h048','archive','article_category','own','archived','','2025-11-30T14:14:57.218+00:00','2025-11-30T14:14:57.218+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzur0035z270m7qthwcl','restore','article_category','own','archived','','2025-11-30T14:14:57.219+00:00','2025-11-30T14:14:57.219+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzus0036z270746broba','review','article_category','own','archived','','2025-11-30T14:14:57.220+00:00','2025-11-30T14:14:57.220+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzut0037z2706ge28pjn','view','article_category','any','archived','','2025-11-30T14:14:57.221+00:00','2025-11-30T14:14:57.221+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzuu0038z270z53rdhns','create','article_category','any','archived','','2025-11-30T14:14:57.222+00:00','2025-11-30T14:14:57.222+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzuv0039z2703kp3tkgb','update','article_category','any','archived','','2025-11-30T14:14:57.223+00:00','2025-11-30T14:14:57.223+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzuw003az27052rqeuan','delete','article_category','any','archived','','2025-11-30T14:14:57.224+00:00','2025-11-30T14:14:57.224+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzux003bz27031ceoi1u','publish','article_category','any','archived','','2025-11-30T14:14:57.225+00:00','2025-11-30T14:14:57.225+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzuy003cz27089c1ecwt','retract','article_category','any','archived','','2025-11-30T14:14:57.226+00:00','2025-11-30T14:14:57.226+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzuz003dz270m1pjahei','archive','article_category','any','archived','','2025-11-30T14:14:57.227+00:00','2025-11-30T14:14:57.227+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzv0003ez270k2hfq8dq','restore','article_category','any','archived','','2025-11-30T14:14:57.228+00:00','2025-11-30T14:14:57.228+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzv1003fz270j7m2h16v','review','article_category','any','archived','','2025-11-30T14:14:57.229+00:00','2025-11-30T14:14:57.229+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzv1003gz270osbr2ztg','view','article_tag','own','draft','','2025-11-30T14:14:57.229+00:00','2025-11-30T14:14:57.229+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzv2003hz2709o2afc7c','create','article_tag','own','draft','','2025-11-30T14:14:57.230+00:00','2025-11-30T14:14:57.230+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzv3003iz2706zlcizrg','update','article_tag','own','draft','','2025-11-30T14:14:57.231+00:00','2025-11-30T14:14:57.231+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzv4003jz270lzgflz02','delete','article_tag','own','draft','','2025-11-30T14:14:57.232+00:00','2025-11-30T14:14:57.232+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzv5003kz270vytle6wi','publish','article_tag','own','draft','','2025-11-30T14:14:57.233+00:00','2025-11-30T14:14:57.233+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzv6003lz270y4ae29jo','retract','article_tag','own','draft','','2025-11-30T14:14:57.234+00:00','2025-11-30T14:14:57.234+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzv7003mz270ypjhcwrj','archive','article_tag','own','draft','','2025-11-30T14:14:57.235+00:00','2025-11-30T14:14:57.235+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzv7003nz270mdz8eumt','restore','article_tag','own','draft','','2025-11-30T14:14:57.235+00:00','2025-11-30T14:14:57.235+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzv8003oz2709lvhsanu','review','article_tag','own','draft','','2025-11-30T14:14:57.236+00:00','2025-11-30T14:14:57.236+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzv8003pz270zf3xilqi','view','article_tag','any','draft','','2025-11-30T14:14:57.236+00:00','2025-11-30T14:14:57.236+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzv9003qz2702e4nt63o','create','article_tag','any','draft','','2025-11-30T14:14:57.237+00:00','2025-11-30T14:14:57.237+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzva003rz27088w71e22','update','article_tag','any','draft','','2025-11-30T14:14:57.238+00:00','2025-11-30T14:14:57.238+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzvb003sz2707nwlmk38','delete','article_tag','any','draft','','2025-11-30T14:14:57.239+00:00','2025-11-30T14:14:57.239+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzvb003tz2707dohiwk9','publish','article_tag','any','draft','','2025-11-30T14:14:57.239+00:00','2025-11-30T14:14:57.239+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzvc003uz2709maaops8','retract','article_tag','any','draft','','2025-11-30T14:14:57.240+00:00','2025-11-30T14:14:57.240+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzvd003vz2704noverpf','archive','article_tag','any','draft','','2025-11-30T14:14:57.241+00:00','2025-11-30T14:14:57.241+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzve003wz2707ne7p0jg','restore','article_tag','any','draft','','2025-11-30T14:14:57.242+00:00','2025-11-30T14:14:57.242+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzvf003xz2704ehehkdq','review','article_tag','any','draft','','2025-11-30T14:14:57.243+00:00','2025-11-30T14:14:57.243+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzvg003yz27094aba8gx','view','article_tag','own','published','','2025-11-30T14:14:57.244+00:00','2025-11-30T14:14:57.244+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzvh003zz270u2yca741','create','article_tag','own','published','','2025-11-30T14:14:57.245+00:00','2025-11-30T14:14:57.245+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzvi0040z270snru620h','update','article_tag','own','published','','2025-11-30T14:14:57.246+00:00','2025-11-30T14:14:57.246+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzvj0041z270y3hr7pf2','delete','article_tag','own','published','','2025-11-30T14:14:57.247+00:00','2025-11-30T14:14:57.247+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzvk0042z2709yjpaixr','publish','article_tag','own','published','','2025-11-30T14:14:57.248+00:00','2025-11-30T14:14:57.248+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzvl0043z270w4gjj4gy','retract','article_tag','own','published','','2025-11-30T14:14:57.249+00:00','2025-11-30T14:14:57.249+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzvl0044z270wd1n7lle','archive','article_tag','own','published','','2025-11-30T14:14:57.249+00:00','2025-11-30T14:14:57.249+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzvm0045z2709llkmh5a','restore','article_tag','own','published','','2025-11-30T14:14:57.250+00:00','2025-11-30T14:14:57.250+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzvm0046z270qk8fuj8s','review','article_tag','own','published','','2025-11-30T14:14:57.250+00:00','2025-11-30T14:14:57.250+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzvn0047z270ke0s0fqf','view','article_tag','any','published','','2025-11-30T14:14:57.251+00:00','2025-11-30T14:14:57.251+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzvo0048z270yx22pzmw','create','article_tag','any','published','','2025-11-30T14:14:57.252+00:00','2025-11-30T14:14:57.252+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzvo0049z270e4b8wdt0','update','article_tag','any','published','','2025-11-30T14:14:57.252+00:00','2025-11-30T14:14:57.252+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzvp004az270h6tslkqt','delete','article_tag','any','published','','2025-11-30T14:14:57.253+00:00','2025-11-30T14:14:57.253+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzvq004bz270ujjsssc1','publish','article_tag','any','published','','2025-11-30T14:14:57.254+00:00','2025-11-30T14:14:57.254+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzvq004cz270uez0jtjz','retract','article_tag','any','published','','2025-11-30T14:14:57.254+00:00','2025-11-30T14:14:57.254+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzvr004dz270oleslq5w','archive','article_tag','any','published','','2025-11-30T14:14:57.255+00:00','2025-11-30T14:14:57.255+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzvs004ez270ecx07z95','restore','article_tag','any','published','','2025-11-30T14:14:57.256+00:00','2025-11-30T14:14:57.256+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzvs004fz270upnvwgjh','review','article_tag','any','published','','2025-11-30T14:14:57.256+00:00','2025-11-30T14:14:57.256+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzvt004gz270nizmyilw','view','article_tag','own','archived','','2025-11-30T14:14:57.257+00:00','2025-11-30T14:14:57.257+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzvu004hz270iclrdjsj','create','article_tag','own','archived','','2025-11-30T14:14:57.258+00:00','2025-11-30T14:14:57.258+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzvv004iz270fvb8zvi4','update','article_tag','own','archived','','2025-11-30T14:14:57.259+00:00','2025-11-30T14:14:57.259+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzvv004jz270ctum5ges','delete','article_tag','own','archived','','2025-11-30T14:14:57.259+00:00','2025-11-30T14:14:57.259+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzvw004kz2709ib1xcz7','publish','article_tag','own','archived','','2025-11-30T14:14:57.260+00:00','2025-11-30T14:14:57.260+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzvx004lz270zoz96ymf','retract','article_tag','own','archived','','2025-11-30T14:14:57.261+00:00','2025-11-30T14:14:57.261+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzvy004mz270ubzb2bjg','archive','article_tag','own','archived','','2025-11-30T14:14:57.262+00:00','2025-11-30T14:14:57.262+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzvz004nz270pzss69ju','restore','article_tag','own','archived','','2025-11-30T14:14:57.263+00:00','2025-11-30T14:14:57.263+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzvz004oz270hm0luyae','review','article_tag','own','archived','','2025-11-30T14:14:57.263+00:00','2025-11-30T14:14:57.263+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzw0004pz270b6race22','view','article_tag','any','archived','','2025-11-30T14:14:57.264+00:00','2025-11-30T14:14:57.264+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzw1004qz270za8yjc0z','create','article_tag','any','archived','','2025-11-30T14:14:57.265+00:00','2025-11-30T14:14:57.265+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzw2004rz270228pmdmy','update','article_tag','any','archived','','2025-11-30T14:14:57.266+00:00','2025-11-30T14:14:57.266+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzw3004sz270s9p57roh','delete','article_tag','any','archived','','2025-11-30T14:14:57.267+00:00','2025-11-30T14:14:57.267+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzw5004tz270ee3zsbky','publish','article_tag','any','archived','','2025-11-30T14:14:57.269+00:00','2025-11-30T14:14:57.269+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzw6004uz2708z1ijrie','retract','article_tag','any','archived','','2025-11-30T14:14:57.270+00:00','2025-11-30T14:14:57.270+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzw6004vz270hb7berjg','archive','article_tag','any','archived','','2025-11-30T14:14:57.270+00:00','2025-11-30T14:14:57.270+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzw8004wz270g0ujoyvb','restore','article_tag','any','archived','','2025-11-30T14:14:57.271+00:00','2025-11-30T14:14:57.271+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzw9004xz270c7eivaaw','review','article_tag','any','archived','','2025-11-30T14:14:57.273+00:00','2025-11-30T14:14:57.273+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzwa004yz270nf72lk8r','view','podcast','own','draft','','2025-11-30T14:14:57.274+00:00','2025-11-30T14:14:57.274+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzwb004zz270a82mk577','create','podcast','own','draft','','2025-11-30T14:14:57.275+00:00','2025-11-30T14:14:57.275+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzwc0050z270l3ikh8le','update','podcast','own','draft','','2025-11-30T14:14:57.276+00:00','2025-11-30T14:14:57.276+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzwc0051z270o1m6802s','delete','podcast','own','draft','','2025-11-30T14:14:57.276+00:00','2025-11-30T14:14:57.276+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzwd0052z2707u1d25j1','publish','podcast','own','draft','','2025-11-30T14:14:57.277+00:00','2025-11-30T14:14:57.277+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzwe0053z2700x90w4fq','retract','podcast','own','draft','','2025-11-30T14:14:57.278+00:00','2025-11-30T14:14:57.278+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzwe0054z270vstk03ll','archive','podcast','own','draft','','2025-11-30T14:14:57.278+00:00','2025-11-30T14:14:57.278+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzwf0055z2701ukoni32','restore','podcast','own','draft','','2025-11-30T14:14:57.279+00:00','2025-11-30T14:14:57.279+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzwg0056z270za4ltzu1','review','podcast','own','draft','','2025-11-30T14:14:57.280+00:00','2025-11-30T14:14:57.280+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzwh0057z270k1d8nm1d','view','podcast','any','draft','','2025-11-30T14:14:57.281+00:00','2025-11-30T14:14:57.281+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzwi0058z270sqsp1w6k','create','podcast','any','draft','','2025-11-30T14:14:57.282+00:00','2025-11-30T14:14:57.282+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzwi0059z2706fw5sxhl','update','podcast','any','draft','','2025-11-30T14:14:57.282+00:00','2025-11-30T14:14:57.282+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzwj005az270lfmatply','delete','podcast','any','draft','','2025-11-30T14:14:57.283+00:00','2025-11-30T14:14:57.283+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzwk005bz270anfr6k6o','publish','podcast','any','draft','','2025-11-30T14:14:57.284+00:00','2025-11-30T14:14:57.284+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzwk005cz270j4gr6yd3','retract','podcast','any','draft','','2025-11-30T14:14:57.284+00:00','2025-11-30T14:14:57.284+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzwl005dz270chnb4hu4','archive','podcast','any','draft','','2025-11-30T14:14:57.285+00:00','2025-11-30T14:14:57.285+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzwm005ez270thyyjzby','restore','podcast','any','draft','','2025-11-30T14:14:57.286+00:00','2025-11-30T14:14:57.286+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzwm005fz270quxlqpoi','review','podcast','any','draft','','2025-11-30T14:14:57.286+00:00','2025-11-30T14:14:57.286+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzwn005gz27054t627d8','view','podcast','own','published','','2025-11-30T14:14:57.287+00:00','2025-11-30T14:14:57.287+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzwo005hz270hskiojd5','create','podcast','own','published','','2025-11-30T14:14:57.288+00:00','2025-11-30T14:14:57.288+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzwo005iz2706e6t3irj','update','podcast','own','published','','2025-11-30T14:14:57.288+00:00','2025-11-30T14:14:57.288+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzwp005jz270kwh4yy09','delete','podcast','own','published','','2025-11-30T14:14:57.289+00:00','2025-11-30T14:14:57.289+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzwq005kz270xpu6483y','publish','podcast','own','published','','2025-11-30T14:14:57.290+00:00','2025-11-30T14:14:57.290+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzwr005lz270xq8cpyxo','retract','podcast','own','published','','2025-11-30T14:14:57.291+00:00','2025-11-30T14:14:57.291+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzws005mz270n36s6xey','archive','podcast','own','published','','2025-11-30T14:14:57.292+00:00','2025-11-30T14:14:57.292+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzwt005nz270s0u9nf74','restore','podcast','own','published','','2025-11-30T14:14:57.293+00:00','2025-11-30T14:14:57.293+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzwu005oz2707el9sox7','review','podcast','own','published','','2025-11-30T14:14:57.294+00:00','2025-11-30T14:14:57.294+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzwv005pz270zpkig6sv','view','podcast','any','published','','2025-11-30T14:14:57.295+00:00','2025-11-30T14:14:57.295+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzwv005qz270q7ow852z','create','podcast','any','published','','2025-11-30T14:14:57.295+00:00','2025-11-30T14:14:57.295+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzww005rz270ldq516hr','update','podcast','any','published','','2025-11-30T14:14:57.296+00:00','2025-11-30T14:14:57.296+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzwx005sz270ky4l13u5','delete','podcast','any','published','','2025-11-30T14:14:57.297+00:00','2025-11-30T14:14:57.297+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzwy005tz2706u6syk1y','publish','podcast','any','published','','2025-11-30T14:14:57.298+00:00','2025-11-30T14:14:57.298+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzwz005uz270qp7earzf','retract','podcast','any','published','','2025-11-30T14:14:57.299+00:00','2025-11-30T14:14:57.299+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzwz005vz27073zv56od','archive','podcast','any','published','','2025-11-30T14:14:57.299+00:00','2025-11-30T14:14:57.299+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzx0005wz270iuc0c6o8','restore','podcast','any','published','','2025-11-30T14:14:57.300+00:00','2025-11-30T14:14:57.300+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzx1005xz270rc0sd4th','review','podcast','any','published','','2025-11-30T14:14:57.301+00:00','2025-11-30T14:14:57.301+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzx1005yz2703xk93rms','view','podcast','own','archived','','2025-11-30T14:14:57.301+00:00','2025-11-30T14:14:57.301+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzx2005zz270mngdtyr4','create','podcast','own','archived','','2025-11-30T14:14:57.302+00:00','2025-11-30T14:14:57.302+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzx30060z270dtebbo6z','update','podcast','own','archived','','2025-11-30T14:14:57.303+00:00','2025-11-30T14:14:57.303+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzx30061z270mayiojh6','delete','podcast','own','archived','','2025-11-30T14:14:57.303+00:00','2025-11-30T14:14:57.303+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzx50062z270cvcv91cg','publish','podcast','own','archived','','2025-11-30T14:14:57.305+00:00','2025-11-30T14:14:57.305+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzx50063z2701ugagidz','retract','podcast','own','archived','','2025-11-30T14:14:57.305+00:00','2025-11-30T14:14:57.305+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzx60064z270j3qy1c3b','archive','podcast','own','archived','','2025-11-30T14:14:57.306+00:00','2025-11-30T14:14:57.306+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzx70065z270u67mj0kw','restore','podcast','own','archived','','2025-11-30T14:14:57.307+00:00','2025-11-30T14:14:57.307+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzx70066z270efn3meh8','review','podcast','own','archived','','2025-11-30T14:14:57.307+00:00','2025-11-30T14:14:57.307+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzx80067z270nhji1qil','view','podcast','any','archived','','2025-11-30T14:14:57.308+00:00','2025-11-30T14:14:57.308+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzx90068z2709nmdlbdm','create','podcast','any','archived','','2025-11-30T14:14:57.309+00:00','2025-11-30T14:14:57.309+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzx90069z2702wjxbo0m','update','podcast','any','archived','','2025-11-30T14:14:57.309+00:00','2025-11-30T14:14:57.309+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzxa006az270m5aajnmg','delete','podcast','any','archived','','2025-11-30T14:14:57.310+00:00','2025-11-30T14:14:57.310+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzxb006bz27030j9knxt','publish','podcast','any','archived','','2025-11-30T14:14:57.311+00:00','2025-11-30T14:14:57.311+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzxb006cz270v6azyjwo','retract','podcast','any','archived','','2025-11-30T14:14:57.311+00:00','2025-11-30T14:14:57.311+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzxc006dz270aoa8jch2','archive','podcast','any','archived','','2025-11-30T14:14:57.312+00:00','2025-11-30T14:14:57.312+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzxd006ez270wbq567fy','restore','podcast','any','archived','','2025-11-30T14:14:57.313+00:00','2025-11-30T14:14:57.313+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzxe006fz27019e3ken5','review','podcast','any','archived','','2025-11-30T14:14:57.314+00:00','2025-11-30T14:14:57.314+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzxe006gz270kqpaajlb','view','podcast_episode','own','draft','','2025-11-30T14:14:57.314+00:00','2025-11-30T14:14:57.314+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzxf006hz270rei0ryaw','create','podcast_episode','own','draft','','2025-11-30T14:14:57.315+00:00','2025-11-30T14:14:57.315+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzxg006iz270h578p6cm','update','podcast_episode','own','draft','','2025-11-30T14:14:57.316+00:00','2025-11-30T14:14:57.316+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzxh006jz2708x1j744y','delete','podcast_episode','own','draft','','2025-11-30T14:14:57.317+00:00','2025-11-30T14:14:57.317+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzxi006kz270ya9ts1fx','publish','podcast_episode','own','draft','','2025-11-30T14:14:57.318+00:00','2025-11-30T14:14:57.318+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzxj006lz270873xcd18','retract','podcast_episode','own','draft','','2025-11-30T14:14:57.319+00:00','2025-11-30T14:14:57.319+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzxk006mz2703aj6sx8x','archive','podcast_episode','own','draft','','2025-11-30T14:14:57.320+00:00','2025-11-30T14:14:57.320+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzxl006nz270vqlvkst7','restore','podcast_episode','own','draft','','2025-11-30T14:14:57.321+00:00','2025-11-30T14:14:57.321+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzxm006oz270mvyawe36','review','podcast_episode','own','draft','','2025-11-30T14:14:57.322+00:00','2025-11-30T14:14:57.322+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzxn006pz270q4u3tyt9','view','podcast_episode','any','draft','','2025-11-30T14:14:57.323+00:00','2025-11-30T14:14:57.323+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzxo006qz270wsunf7d3','create','podcast_episode','any','draft','','2025-11-30T14:14:57.324+00:00','2025-11-30T14:14:57.324+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzxp006rz270uthe0c9c','update','podcast_episode','any','draft','','2025-11-30T14:14:57.325+00:00','2025-11-30T14:14:57.325+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzxq006sz270ser5xfa5','delete','podcast_episode','any','draft','','2025-11-30T14:14:57.326+00:00','2025-11-30T14:14:57.326+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzxr006tz270umy8ibcq','publish','podcast_episode','any','draft','','2025-11-30T14:14:57.327+00:00','2025-11-30T14:14:57.327+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzxr006uz270ul0ynxtb','retract','podcast_episode','any','draft','','2025-11-30T14:14:57.327+00:00','2025-11-30T14:14:57.327+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzxs006vz2707mdbnrs3','archive','podcast_episode','any','draft','','2025-11-30T14:14:57.328+00:00','2025-11-30T14:14:57.328+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzxt006wz2704rp177rc','restore','podcast_episode','any','draft','','2025-11-30T14:14:57.328+00:00','2025-11-30T14:14:57.328+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzxt006xz270i0ssj6hy','review','podcast_episode','any','draft','','2025-11-30T14:14:57.329+00:00','2025-11-30T14:14:57.329+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzxu006yz2706ry0kfl4','view','podcast_episode','own','published','','2025-11-30T14:14:57.330+00:00','2025-11-30T14:14:57.330+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzxv006zz270ntzj8aty','create','podcast_episode','own','published','','2025-11-30T14:14:57.331+00:00','2025-11-30T14:14:57.331+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzxv0070z270mq6etzmp','update','podcast_episode','own','published','','2025-11-30T14:14:57.331+00:00','2025-11-30T14:14:57.331+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzxw0071z270kxi06eu2','delete','podcast_episode','own','published','','2025-11-30T14:14:57.332+00:00','2025-11-30T14:14:57.332+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzxx0072z27002sfc9o7','publish','podcast_episode','own','published','','2025-11-30T14:14:57.333+00:00','2025-11-30T14:14:57.333+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzxx0073z270vyj53r5c','retract','podcast_episode','own','published','','2025-11-30T14:14:57.333+00:00','2025-11-30T14:14:57.333+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzxy0074z270rk9hn500','archive','podcast_episode','own','published','','2025-11-30T14:14:57.334+00:00','2025-11-30T14:14:57.334+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzxz0075z270gije6s3d','restore','podcast_episode','own','published','','2025-11-30T14:14:57.335+00:00','2025-11-30T14:14:57.335+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzxz0076z270p562q4ka','review','podcast_episode','own','published','','2025-11-30T14:14:57.335+00:00','2025-11-30T14:14:57.335+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzy00077z270rrc2xpib','view','podcast_episode','any','published','','2025-11-30T14:14:57.336+00:00','2025-11-30T14:14:57.336+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzy10078z270vw1lun5p','create','podcast_episode','any','published','','2025-11-30T14:14:57.337+00:00','2025-11-30T14:14:57.337+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzy10079z270c7b86c1f','update','podcast_episode','any','published','','2025-11-30T14:14:57.337+00:00','2025-11-30T14:14:57.337+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzy2007az270pa179ety','delete','podcast_episode','any','published','','2025-11-30T14:14:57.338+00:00','2025-11-30T14:14:57.338+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzy3007bz270rjahzlb5','publish','podcast_episode','any','published','','2025-11-30T14:14:57.339+00:00','2025-11-30T14:14:57.339+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzy4007cz2709zmdi5rj','retract','podcast_episode','any','published','','2025-11-30T14:14:57.340+00:00','2025-11-30T14:14:57.340+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzy4007dz270jzp0yqfp','archive','podcast_episode','any','published','','2025-11-30T14:14:57.340+00:00','2025-11-30T14:14:57.340+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzy5007ez270bvyywe9x','restore','podcast_episode','any','published','','2025-11-30T14:14:57.341+00:00','2025-11-30T14:14:57.341+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzy5007fz270lgjyif4w','review','podcast_episode','any','published','','2025-11-30T14:14:57.341+00:00','2025-11-30T14:14:57.341+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzy6007gz270us7vj3ez','view','podcast_episode','own','archived','','2025-11-30T14:14:57.342+00:00','2025-11-30T14:14:57.342+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzy7007hz270qjdmgy6c','create','podcast_episode','own','archived','','2025-11-30T14:14:57.343+00:00','2025-11-30T14:14:57.343+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzy7007iz2700rtpfg1l','update','podcast_episode','own','archived','','2025-11-30T14:14:57.343+00:00','2025-11-30T14:14:57.343+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzy8007jz270alw5i38d','delete','podcast_episode','own','archived','','2025-11-30T14:14:57.344+00:00','2025-11-30T14:14:57.344+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzy9007kz270d5out1nx','publish','podcast_episode','own','archived','','2025-11-30T14:14:57.345+00:00','2025-11-30T14:14:57.345+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzy9007lz270bq3h1umn','retract','podcast_episode','own','archived','','2025-11-30T14:14:57.345+00:00','2025-11-30T14:14:57.345+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzya007mz27071uyaied','archive','podcast_episode','own','archived','','2025-11-30T14:14:57.346+00:00','2025-11-30T14:14:57.346+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzya007nz270m6dpkk0u','restore','podcast_episode','own','archived','','2025-11-30T14:14:57.346+00:00','2025-11-30T14:14:57.346+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzyb007oz270rwsr66dg','review','podcast_episode','own','archived','','2025-11-30T14:14:57.347+00:00','2025-11-30T14:14:57.347+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzyc007pz270dhw4tuoo','view','podcast_episode','any','archived','','2025-11-30T14:14:57.348+00:00','2025-11-30T14:14:57.348+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzyd007qz270u6b55fuy','create','podcast_episode','any','archived','','2025-11-30T14:14:57.349+00:00','2025-11-30T14:14:57.349+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzyd007rz270s6ebbq90','update','podcast_episode','any','archived','','2025-11-30T14:14:57.349+00:00','2025-11-30T14:14:57.349+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzye007sz270z8jhy3u5','delete','podcast_episode','any','archived','','2025-11-30T14:14:57.350+00:00','2025-11-30T14:14:57.350+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzyf007tz270r3z7g8lf','publish','podcast_episode','any','archived','','2025-11-30T14:14:57.351+00:00','2025-11-30T14:14:57.351+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzyf007uz270sgvwssqn','retract','podcast_episode','any','archived','','2025-11-30T14:14:57.351+00:00','2025-11-30T14:14:57.351+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzyg007vz270wqosypep','archive','podcast_episode','any','archived','','2025-11-30T14:14:57.352+00:00','2025-11-30T14:14:57.352+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzyh007wz27046ht3scq','restore','podcast_episode','any','archived','','2025-11-30T14:14:57.353+00:00','2025-11-30T14:14:57.353+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzyh007xz270t7t7dojs','review','podcast_episode','any','archived','','2025-11-30T14:14:57.353+00:00','2025-11-30T14:14:57.353+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzyi007yz270nm2m6qr9','view','podcast_episode_link','own','draft','','2025-11-30T14:14:57.354+00:00','2025-11-30T14:14:57.354+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzyj007zz270foewaqm9','create','podcast_episode_link','own','draft','','2025-11-30T14:14:57.355+00:00','2025-11-30T14:14:57.355+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzyj0080z2703qmpd4zt','update','podcast_episode_link','own','draft','','2025-11-30T14:14:57.355+00:00','2025-11-30T14:14:57.355+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzyk0081z270se7bkz07','delete','podcast_episode_link','own','draft','','2025-11-30T14:14:57.356+00:00','2025-11-30T14:14:57.356+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzyl0082z270uqc0oc1b','publish','podcast_episode_link','own','draft','','2025-11-30T14:14:57.357+00:00','2025-11-30T14:14:57.357+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzym0083z270flrr45xr','retract','podcast_episode_link','own','draft','','2025-11-30T14:14:57.358+00:00','2025-11-30T14:14:57.358+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzym0084z270h6wtq66m','archive','podcast_episode_link','own','draft','','2025-11-30T14:14:57.358+00:00','2025-11-30T14:14:57.358+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzyn0085z270p2eujorh','restore','podcast_episode_link','own','draft','','2025-11-30T14:14:57.359+00:00','2025-11-30T14:14:57.359+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzyo0086z270mhv7f5x8','review','podcast_episode_link','own','draft','','2025-11-30T14:14:57.360+00:00','2025-11-30T14:14:57.360+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzyo0087z270nwlv58tu','view','podcast_episode_link','any','draft','','2025-11-30T14:14:57.360+00:00','2025-11-30T14:14:57.360+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzyq0088z270543g0bq0','create','podcast_episode_link','any','draft','','2025-11-30T14:14:57.362+00:00','2025-11-30T14:14:57.362+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzys0089z270uneebsl7','update','podcast_episode_link','any','draft','','2025-11-30T14:14:57.364+00:00','2025-11-30T14:14:57.364+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzyt008az270s0u6rrpa','delete','podcast_episode_link','any','draft','','2025-11-30T14:14:57.365+00:00','2025-11-30T14:14:57.365+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzyu008bz270uweutlkh','publish','podcast_episode_link','any','draft','','2025-11-30T14:14:57.366+00:00','2025-11-30T14:14:57.366+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzyu008cz2702kxh9lna','retract','podcast_episode_link','any','draft','','2025-11-30T14:14:57.366+00:00','2025-11-30T14:14:57.366+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzyv008dz270ex8ekf5b','archive','podcast_episode_link','any','draft','','2025-11-30T14:14:57.367+00:00','2025-11-30T14:14:57.367+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzyw008ez270xv7mdc7j','restore','podcast_episode_link','any','draft','','2025-11-30T14:14:57.368+00:00','2025-11-30T14:14:57.368+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzyw008fz270gqnnanxu','review','podcast_episode_link','any','draft','','2025-11-30T14:14:57.368+00:00','2025-11-30T14:14:57.368+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzyx008gz270km3pn8og','view','podcast_episode_link','own','published','','2025-11-30T14:14:57.369+00:00','2025-11-30T14:14:57.369+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzyy008hz270rhpkez5b','create','podcast_episode_link','own','published','','2025-11-30T14:14:57.370+00:00','2025-11-30T14:14:57.370+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzyz008iz270x2inyhzn','update','podcast_episode_link','own','published','','2025-11-30T14:14:57.371+00:00','2025-11-30T14:14:57.371+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzyz008jz270k7ybrh7p','delete','podcast_episode_link','own','published','','2025-11-30T14:14:57.371+00:00','2025-11-30T14:14:57.371+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzz0008kz270ov12r1mo','publish','podcast_episode_link','own','published','','2025-11-30T14:14:57.372+00:00','2025-11-30T14:14:57.372+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzz1008lz270efese05w','retract','podcast_episode_link','own','published','','2025-11-30T14:14:57.373+00:00','2025-11-30T14:14:57.373+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzz2008mz270x87gibwf','archive','podcast_episode_link','own','published','','2025-11-30T14:14:57.374+00:00','2025-11-30T14:14:57.374+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzz3008nz270izz8hp2y','restore','podcast_episode_link','own','published','','2025-11-30T14:14:57.375+00:00','2025-11-30T14:14:57.375+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzz4008oz270ldl31tis','review','podcast_episode_link','own','published','','2025-11-30T14:14:57.376+00:00','2025-11-30T14:14:57.376+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzz4008pz270xfgx4ox7','view','podcast_episode_link','any','published','','2025-11-30T14:14:57.376+00:00','2025-11-30T14:14:57.376+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzz5008qz270pi3gbfhd','create','podcast_episode_link','any','published','','2025-11-30T14:14:57.377+00:00','2025-11-30T14:14:57.377+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzz6008rz270pvctsw6j','update','podcast_episode_link','any','published','','2025-11-30T14:14:57.378+00:00','2025-11-30T14:14:57.378+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzz6008sz270fogmky8i','delete','podcast_episode_link','any','published','','2025-11-30T14:14:57.378+00:00','2025-11-30T14:14:57.378+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzz7008tz270n7o6eb7p','publish','podcast_episode_link','any','published','','2025-11-30T14:14:57.379+00:00','2025-11-30T14:14:57.379+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzz8008uz270ttb4sqkj','retract','podcast_episode_link','any','published','','2025-11-30T14:14:57.380+00:00','2025-11-30T14:14:57.380+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzz8008vz270zu3jgcca','archive','podcast_episode_link','any','published','','2025-11-30T14:14:57.380+00:00','2025-11-30T14:14:57.380+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzz9008wz27036zhtxfe','restore','podcast_episode_link','any','published','','2025-11-30T14:14:57.381+00:00','2025-11-30T14:14:57.381+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzza008xz270mwu712p9','review','podcast_episode_link','any','published','','2025-11-30T14:14:57.382+00:00','2025-11-30T14:14:57.382+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzzb008yz270u76p8ko5','view','podcast_episode_link','own','archived','','2025-11-30T14:14:57.383+00:00','2025-11-30T14:14:57.383+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzzb008zz2704he4q03v','create','podcast_episode_link','own','archived','','2025-11-30T14:14:57.383+00:00','2025-11-30T14:14:57.383+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzzc0090z270a1oi74o4','update','podcast_episode_link','own','archived','','2025-11-30T14:14:57.384+00:00','2025-11-30T14:14:57.384+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzzd0091z270yisvl6zm','delete','podcast_episode_link','own','archived','','2025-11-30T14:14:57.385+00:00','2025-11-30T14:14:57.385+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzzd0092z270nj1x4qvh','publish','podcast_episode_link','own','archived','','2025-11-30T14:14:57.385+00:00','2025-11-30T14:14:57.385+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzze0093z270dgz71le6','retract','podcast_episode_link','own','archived','','2025-11-30T14:14:57.386+00:00','2025-11-30T14:14:57.386+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzzf0094z270ftxoupnf','archive','podcast_episode_link','own','archived','','2025-11-30T14:14:57.387+00:00','2025-11-30T14:14:57.387+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzzf0095z270vrkj3juu','restore','podcast_episode_link','own','archived','','2025-11-30T14:14:57.387+00:00','2025-11-30T14:14:57.387+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzzg0096z270y2faki4y','review','podcast_episode_link','own','archived','','2025-11-30T14:14:57.388+00:00','2025-11-30T14:14:57.388+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzzh0097z2702zanx3vf','view','podcast_episode_link','any','archived','','2025-11-30T14:14:57.389+00:00','2025-11-30T14:14:57.389+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzzi0098z270ffisx3ve','create','podcast_episode_link','any','archived','','2025-11-30T14:14:57.390+00:00','2025-11-30T14:14:57.390+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzzj0099z270ic5mgrn6','update','podcast_episode_link','any','archived','','2025-11-30T14:14:57.391+00:00','2025-11-30T14:14:57.391+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzzj009az2705kcbvz3e','delete','podcast_episode_link','any','archived','','2025-11-30T14:14:57.391+00:00','2025-11-30T14:14:57.391+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzzk009bz2705g36w4rs','publish','podcast_episode_link','any','archived','','2025-11-30T14:14:57.392+00:00','2025-11-30T14:14:57.392+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzzl009cz270pm7byky6','retract','podcast_episode_link','any','archived','','2025-11-30T14:14:57.393+00:00','2025-11-30T14:14:57.393+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzzl009dz270y19eser1','archive','podcast_episode_link','any','archived','','2025-11-30T14:14:57.393+00:00','2025-11-30T14:14:57.393+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzzm009ez270xunj43fr','restore','podcast_episode_link','any','archived','','2025-11-30T14:14:57.394+00:00','2025-11-30T14:14:57.394+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzzn009fz270aun8nvs2','review','podcast_episode_link','any','archived','','2025-11-30T14:14:57.395+00:00','2025-11-30T14:14:57.395+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzzn009gz270tw4aefwt','view','issue','own','draft','','2025-11-30T14:14:57.395+00:00','2025-11-30T14:14:57.395+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzzo009hz270xhxpwn6e','create','issue','own','draft','','2025-11-30T14:14:57.396+00:00','2025-11-30T14:14:57.396+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzzp009iz270tzrrp5sp','update','issue','own','draft','','2025-11-30T14:14:57.397+00:00','2025-11-30T14:14:57.397+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzzp009jz2700hjkyoon','delete','issue','own','draft','','2025-11-30T14:14:57.397+00:00','2025-11-30T14:14:57.397+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzzq009kz2707qsev99x','publish','issue','own','draft','','2025-11-30T14:14:57.398+00:00','2025-11-30T14:14:57.398+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzzr009lz270x29t913k','retract','issue','own','draft','','2025-11-30T14:14:57.399+00:00','2025-11-30T14:14:57.399+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzzr009mz270b4jbdjiq','archive','issue','own','draft','','2025-11-30T14:14:57.399+00:00','2025-11-30T14:14:57.399+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzzs009nz270r4iy3g4o','restore','issue','own','draft','','2025-11-30T14:14:57.400+00:00','2025-11-30T14:14:57.400+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzzt009oz270xv9eeh4c','review','issue','own','draft','','2025-11-30T14:14:57.401+00:00','2025-11-30T14:14:57.401+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzzt009pz270jguicbph','view','issue','any','draft','','2025-11-30T14:14:57.401+00:00','2025-11-30T14:14:57.401+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzzu009qz270vnpebndh','create','issue','any','draft','','2025-11-30T14:14:57.402+00:00','2025-11-30T14:14:57.402+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzzu009rz2700x7vfngf','update','issue','any','draft','','2025-11-30T14:14:57.402+00:00','2025-11-30T14:14:57.402+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzzv009sz2701a2uqi1u','delete','issue','any','draft','','2025-11-30T14:14:57.403+00:00','2025-11-30T14:14:57.403+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzzw009tz2709e14b9pn','publish','issue','any','draft','','2025-11-30T14:14:57.403+00:00','2025-11-30T14:14:57.403+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzzw009uz270qjsl47z0','retract','issue','any','draft','','2025-11-30T14:14:57.404+00:00','2025-11-30T14:14:57.404+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzzx009vz270iwxbgg3l','archive','issue','any','draft','','2025-11-30T14:14:57.405+00:00','2025-11-30T14:14:57.405+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzzx009wz2709l4tcbu1','restore','issue','any','draft','','2025-11-30T14:14:57.405+00:00','2025-11-30T14:14:57.405+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzzy009xz27061bh1lmb','review','issue','any','draft','','2025-11-30T14:14:57.406+00:00','2025-11-30T14:14:57.406+00:00');
INSERT INTO AuthorPermission VALUES('cmilsxzzz009yz270lrt82kdb','view','issue','own','published','','2025-11-30T14:14:57.407+00:00','2025-11-30T14:14:57.407+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy000009zz2701lkb7rhh','create','issue','own','published','','2025-11-30T14:14:57.408+00:00','2025-11-30T14:14:57.408+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy00000a0z270zob46onb','update','issue','own','published','','2025-11-30T14:14:57.408+00:00','2025-11-30T14:14:57.408+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy00200a1z270pozy5mao','delete','issue','own','published','','2025-11-30T14:14:57.410+00:00','2025-11-30T14:14:57.410+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy00200a2z27092e0x0ri','publish','issue','own','published','','2025-11-30T14:14:57.410+00:00','2025-11-30T14:14:57.410+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy00300a3z270kwet4qj9','retract','issue','own','published','','2025-11-30T14:14:57.411+00:00','2025-11-30T14:14:57.411+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy00400a4z270phbndlbe','archive','issue','own','published','','2025-11-30T14:14:57.412+00:00','2025-11-30T14:14:57.412+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy00400a5z270r5heer0n','restore','issue','own','published','','2025-11-30T14:14:57.412+00:00','2025-11-30T14:14:57.412+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy00500a6z270atiaben5','review','issue','own','published','','2025-11-30T14:14:57.413+00:00','2025-11-30T14:14:57.413+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy00600a7z2707yiqjgvs','view','issue','any','published','','2025-11-30T14:14:57.414+00:00','2025-11-30T14:14:57.414+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy00700a8z270aezuujrx','create','issue','any','published','','2025-11-30T14:14:57.415+00:00','2025-11-30T14:14:57.415+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy00700a9z2704z7y81k8','update','issue','any','published','','2025-11-30T14:14:57.415+00:00','2025-11-30T14:14:57.415+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy00800aaz270lp93du30','delete','issue','any','published','','2025-11-30T14:14:57.416+00:00','2025-11-30T14:14:57.416+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy00900abz270eqn4s9sx','publish','issue','any','published','','2025-11-30T14:14:57.417+00:00','2025-11-30T14:14:57.417+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy00900acz27018hapdc7','retract','issue','any','published','','2025-11-30T14:14:57.417+00:00','2025-11-30T14:14:57.417+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy00a00adz270oc64425x','archive','issue','any','published','','2025-11-30T14:14:57.418+00:00','2025-11-30T14:14:57.418+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy00b00aez270yyu6safy','restore','issue','any','published','','2025-11-30T14:14:57.419+00:00','2025-11-30T14:14:57.419+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy00c00afz270na7os5bv','review','issue','any','published','','2025-11-30T14:14:57.420+00:00','2025-11-30T14:14:57.420+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy00d00agz270wcfgrdxn','view','issue','own','archived','','2025-11-30T14:14:57.421+00:00','2025-11-30T14:14:57.421+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy00e00ahz270obwupq1i','create','issue','own','archived','','2025-11-30T14:14:57.422+00:00','2025-11-30T14:14:57.422+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy00f00aiz2704b3jqp43','update','issue','own','archived','','2025-11-30T14:14:57.423+00:00','2025-11-30T14:14:57.423+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy00g00ajz270f75oezn0','delete','issue','own','archived','','2025-11-30T14:14:57.424+00:00','2025-11-30T14:14:57.424+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy00h00akz270psno1tse','publish','issue','own','archived','','2025-11-30T14:14:57.425+00:00','2025-11-30T14:14:57.425+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy00i00alz270b11lb6jt','retract','issue','own','archived','','2025-11-30T14:14:57.426+00:00','2025-11-30T14:14:57.426+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy00j00amz2709fca7l2x','archive','issue','own','archived','','2025-11-30T14:14:57.427+00:00','2025-11-30T14:14:57.427+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy00k00anz2704xwe1bnm','restore','issue','own','archived','','2025-11-30T14:14:57.428+00:00','2025-11-30T14:14:57.428+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy00l00aoz270wstzymp8','review','issue','own','archived','','2025-11-30T14:14:57.429+00:00','2025-11-30T14:14:57.429+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy00l00apz270noja5w5r','view','issue','any','archived','','2025-11-30T14:14:57.429+00:00','2025-11-30T14:14:57.429+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy00m00aqz270pm1okoxy','create','issue','any','archived','','2025-11-30T14:14:57.430+00:00','2025-11-30T14:14:57.430+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy00o00arz270r5hiu5wc','update','issue','any','archived','','2025-11-30T14:14:57.431+00:00','2025-11-30T14:14:57.431+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy00o00asz270uuinofqn','delete','issue','any','archived','','2025-11-30T14:14:57.432+00:00','2025-11-30T14:14:57.432+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy00p00atz270kj3qtkll','publish','issue','any','archived','','2025-11-30T14:14:57.433+00:00','2025-11-30T14:14:57.433+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy00q00auz270mebfk15t','retract','issue','any','archived','','2025-11-30T14:14:57.434+00:00','2025-11-30T14:14:57.434+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy00q00avz2704dccv5jw','archive','issue','any','archived','','2025-11-30T14:14:57.434+00:00','2025-11-30T14:14:57.434+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy00r00awz2707fn76gnk','restore','issue','any','archived','','2025-11-30T14:14:57.435+00:00','2025-11-30T14:14:57.435+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy00s00axz270r1xxk8ac','review','issue','any','archived','','2025-11-30T14:14:57.436+00:00','2025-11-30T14:14:57.436+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy00s00ayz270r43jix5a','view','editorial_board_position','own','draft','','2025-11-30T14:14:57.436+00:00','2025-11-30T14:14:57.436+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy00t00azz270td1llzro','create','editorial_board_position','own','draft','','2025-11-30T14:14:57.437+00:00','2025-11-30T14:14:57.437+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy00u00b0z270751q3kdb','update','editorial_board_position','own','draft','','2025-11-30T14:14:57.438+00:00','2025-11-30T14:14:57.438+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy00u00b1z270lg58ymzv','delete','editorial_board_position','own','draft','','2025-11-30T14:14:57.438+00:00','2025-11-30T14:14:57.438+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy00v00b2z270khivefwm','publish','editorial_board_position','own','draft','','2025-11-30T14:14:57.439+00:00','2025-11-30T14:14:57.439+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy00w00b3z270owf80b50','retract','editorial_board_position','own','draft','','2025-11-30T14:14:57.440+00:00','2025-11-30T14:14:57.440+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy00w00b4z270shsg06pj','archive','editorial_board_position','own','draft','','2025-11-30T14:14:57.440+00:00','2025-11-30T14:14:57.440+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy00x00b5z270ejcf0s8s','restore','editorial_board_position','own','draft','','2025-11-30T14:14:57.441+00:00','2025-11-30T14:14:57.441+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy00y00b6z2708efzy753','review','editorial_board_position','own','draft','','2025-11-30T14:14:57.442+00:00','2025-11-30T14:14:57.442+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy00y00b7z270v8em8i31','view','editorial_board_position','any','draft','','2025-11-30T14:14:57.442+00:00','2025-11-30T14:14:57.442+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy00z00b8z2709l5b2aka','create','editorial_board_position','any','draft','','2025-11-30T14:14:57.443+00:00','2025-11-30T14:14:57.443+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01000b9z2700fqweci3','update','editorial_board_position','any','draft','','2025-11-30T14:14:57.444+00:00','2025-11-30T14:14:57.444+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01000baz270isb6f3ii','delete','editorial_board_position','any','draft','','2025-11-30T14:14:57.444+00:00','2025-11-30T14:14:57.444+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01100bbz270zcib2trq','publish','editorial_board_position','any','draft','','2025-11-30T14:14:57.445+00:00','2025-11-30T14:14:57.445+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01100bcz270ukd485t2','retract','editorial_board_position','any','draft','','2025-11-30T14:14:57.445+00:00','2025-11-30T14:14:57.445+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01200bdz270gq3zk1nk','archive','editorial_board_position','any','draft','','2025-11-30T14:14:57.446+00:00','2025-11-30T14:14:57.446+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01200bez27033rksswd','restore','editorial_board_position','any','draft','','2025-11-30T14:14:57.446+00:00','2025-11-30T14:14:57.446+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01300bfz270082pa7xb','review','editorial_board_position','any','draft','','2025-11-30T14:14:57.447+00:00','2025-11-30T14:14:57.447+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01400bgz270oe9ymuq5','view','editorial_board_position','own','published','','2025-11-30T14:14:57.448+00:00','2025-11-30T14:14:57.448+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01500bhz270tvmsn7yc','create','editorial_board_position','own','published','','2025-11-30T14:14:57.449+00:00','2025-11-30T14:14:57.449+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01500biz2701jfae4gy','update','editorial_board_position','own','published','','2025-11-30T14:14:57.449+00:00','2025-11-30T14:14:57.449+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01600bjz270vjcd98iv','delete','editorial_board_position','own','published','','2025-11-30T14:14:57.450+00:00','2025-11-30T14:14:57.450+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01700bkz2702lwjp6wo','publish','editorial_board_position','own','published','','2025-11-30T14:14:57.451+00:00','2025-11-30T14:14:57.451+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01700blz270fjxxzn08','retract','editorial_board_position','own','published','','2025-11-30T14:14:57.451+00:00','2025-11-30T14:14:57.451+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01800bmz2704agd7xe3','archive','editorial_board_position','own','published','','2025-11-30T14:14:57.452+00:00','2025-11-30T14:14:57.452+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01900bnz270zamgqtv7','restore','editorial_board_position','own','published','','2025-11-30T14:14:57.453+00:00','2025-11-30T14:14:57.453+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01a00boz270bbwhcwbh','review','editorial_board_position','own','published','','2025-11-30T14:14:57.454+00:00','2025-11-30T14:14:57.454+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01a00bpz270a6s9upgu','view','editorial_board_position','any','published','','2025-11-30T14:14:57.454+00:00','2025-11-30T14:14:57.454+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01c00bqz270z3vhyste','create','editorial_board_position','any','published','','2025-11-30T14:14:57.455+00:00','2025-11-30T14:14:57.455+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01c00brz270k1fhio4b','update','editorial_board_position','any','published','','2025-11-30T14:14:57.456+00:00','2025-11-30T14:14:57.456+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01d00bsz2701zyg139m','delete','editorial_board_position','any','published','','2025-11-30T14:14:57.457+00:00','2025-11-30T14:14:57.457+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01e00btz2709cyuwaky','publish','editorial_board_position','any','published','','2025-11-30T14:14:57.458+00:00','2025-11-30T14:14:57.458+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01e00buz270aatss0ro','retract','editorial_board_position','any','published','','2025-11-30T14:14:57.458+00:00','2025-11-30T14:14:57.458+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01f00bvz270zzvrlm81','archive','editorial_board_position','any','published','','2025-11-30T14:14:57.459+00:00','2025-11-30T14:14:57.459+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01g00bwz270nkkm6v5q','restore','editorial_board_position','any','published','','2025-11-30T14:14:57.460+00:00','2025-11-30T14:14:57.460+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01g00bxz27018pm87k5','review','editorial_board_position','any','published','','2025-11-30T14:14:57.460+00:00','2025-11-30T14:14:57.460+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01h00byz270st5ojn3k','view','editorial_board_position','own','archived','','2025-11-30T14:14:57.461+00:00','2025-11-30T14:14:57.461+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01i00bzz2703zqrebth','create','editorial_board_position','own','archived','','2025-11-30T14:14:57.462+00:00','2025-11-30T14:14:57.462+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01i00c0z270wiufiw0b','update','editorial_board_position','own','archived','','2025-11-30T14:14:57.462+00:00','2025-11-30T14:14:57.462+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01j00c1z2706aki7x1d','delete','editorial_board_position','own','archived','','2025-11-30T14:14:57.463+00:00','2025-11-30T14:14:57.463+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01j00c2z270a5whu2st','publish','editorial_board_position','own','archived','','2025-11-30T14:14:57.463+00:00','2025-11-30T14:14:57.463+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01k00c3z2709xujdkjx','retract','editorial_board_position','own','archived','','2025-11-30T14:14:57.464+00:00','2025-11-30T14:14:57.464+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01l00c4z270atn4yw2m','archive','editorial_board_position','own','archived','','2025-11-30T14:14:57.465+00:00','2025-11-30T14:14:57.465+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01l00c5z270849r8a4c','restore','editorial_board_position','own','archived','','2025-11-30T14:14:57.465+00:00','2025-11-30T14:14:57.465+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01m00c6z270mb0zh2s0','review','editorial_board_position','own','archived','','2025-11-30T14:14:57.466+00:00','2025-11-30T14:14:57.466+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01n00c7z2701xzc2jgn','view','editorial_board_position','any','archived','','2025-11-30T14:14:57.467+00:00','2025-11-30T14:14:57.467+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01n00c8z270rm3bx0k5','create','editorial_board_position','any','archived','','2025-11-30T14:14:57.467+00:00','2025-11-30T14:14:57.467+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01o00c9z2707k4z2zy9','update','editorial_board_position','any','archived','','2025-11-30T14:14:57.468+00:00','2025-11-30T14:14:57.468+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01o00caz270g467aacm','delete','editorial_board_position','any','archived','','2025-11-30T14:14:57.468+00:00','2025-11-30T14:14:57.468+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01p00cbz270wb854zkh','publish','editorial_board_position','any','archived','','2025-11-30T14:14:57.469+00:00','2025-11-30T14:14:57.469+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01q00ccz270fp9tqrck','retract','editorial_board_position','any','archived','','2025-11-30T14:14:57.470+00:00','2025-11-30T14:14:57.470+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01r00cdz270295fn3v2','archive','editorial_board_position','any','archived','','2025-11-30T14:14:57.471+00:00','2025-11-30T14:14:57.471+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01s00cez270ui1i4v6n','restore','editorial_board_position','any','archived','','2025-11-30T14:14:57.472+00:00','2025-11-30T14:14:57.472+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01t00cfz270by4pvn9w','review','editorial_board_position','any','archived','','2025-11-30T14:14:57.473+00:00','2025-11-30T14:14:57.473+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01u00cgz27043q9gjm6','view','editorial_board_member','own','draft','','2025-11-30T14:14:57.474+00:00','2025-11-30T14:14:57.474+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01v00chz270ykv90f9r','create','editorial_board_member','own','draft','','2025-11-30T14:14:57.475+00:00','2025-11-30T14:14:57.475+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01w00ciz270ck8ixwz4','update','editorial_board_member','own','draft','','2025-11-30T14:14:57.476+00:00','2025-11-30T14:14:57.476+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01w00cjz27049aenpvr','delete','editorial_board_member','own','draft','','2025-11-30T14:14:57.476+00:00','2025-11-30T14:14:57.476+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01y00ckz270wiqy23mm','publish','editorial_board_member','own','draft','','2025-11-30T14:14:57.478+00:00','2025-11-30T14:14:57.478+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy01z00clz270qq89ldl6','retract','editorial_board_member','own','draft','','2025-11-30T14:14:57.479+00:00','2025-11-30T14:14:57.479+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02000cmz2707wthvvx6','archive','editorial_board_member','own','draft','','2025-11-30T14:14:57.480+00:00','2025-11-30T14:14:57.480+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02100cnz270ybmio9wq','restore','editorial_board_member','own','draft','','2025-11-30T14:14:57.481+00:00','2025-11-30T14:14:57.481+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02200coz270qp0mozy6','review','editorial_board_member','own','draft','','2025-11-30T14:14:57.482+00:00','2025-11-30T14:14:57.482+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02300cpz270x34ww369','view','editorial_board_member','any','draft','','2025-11-30T14:14:57.483+00:00','2025-11-30T14:14:57.483+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02300cqz270yamn2w4a','create','editorial_board_member','any','draft','','2025-11-30T14:14:57.483+00:00','2025-11-30T14:14:57.483+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02400crz27010p1zzmr','update','editorial_board_member','any','draft','','2025-11-30T14:14:57.484+00:00','2025-11-30T14:14:57.484+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02500csz270p9kn83p5','delete','editorial_board_member','any','draft','','2025-11-30T14:14:57.485+00:00','2025-11-30T14:14:57.485+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02500ctz27077skg93f','publish','editorial_board_member','any','draft','','2025-11-30T14:14:57.485+00:00','2025-11-30T14:14:57.485+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02600cuz270t49ty4kf','retract','editorial_board_member','any','draft','','2025-11-30T14:14:57.486+00:00','2025-11-30T14:14:57.486+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02700cvz2702ioszjzb','archive','editorial_board_member','any','draft','','2025-11-30T14:14:57.487+00:00','2025-11-30T14:14:57.487+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02700cwz2706ipfb6qp','restore','editorial_board_member','any','draft','','2025-11-30T14:14:57.487+00:00','2025-11-30T14:14:57.487+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02800cxz2709nwn6eru','review','editorial_board_member','any','draft','','2025-11-30T14:14:57.488+00:00','2025-11-30T14:14:57.488+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02900cyz270uwxk4ubr','view','editorial_board_member','own','published','','2025-11-30T14:14:57.489+00:00','2025-11-30T14:14:57.489+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02900czz2709ssf7725','create','editorial_board_member','own','published','','2025-11-30T14:14:57.489+00:00','2025-11-30T14:14:57.489+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02a00d0z2704ci00osx','update','editorial_board_member','own','published','','2025-11-30T14:14:57.490+00:00','2025-11-30T14:14:57.490+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02b00d1z27079vu473o','delete','editorial_board_member','own','published','','2025-11-30T14:14:57.491+00:00','2025-11-30T14:14:57.491+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02c00d2z2704pugfvue','publish','editorial_board_member','own','published','','2025-11-30T14:14:57.492+00:00','2025-11-30T14:14:57.492+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02d00d3z270thgpmm9x','retract','editorial_board_member','own','published','','2025-11-30T14:14:57.493+00:00','2025-11-30T14:14:57.493+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02d00d4z270ywm5kskn','archive','editorial_board_member','own','published','','2025-11-30T14:14:57.493+00:00','2025-11-30T14:14:57.493+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02e00d5z270n502guhl','restore','editorial_board_member','own','published','','2025-11-30T14:14:57.494+00:00','2025-11-30T14:14:57.494+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02f00d6z270bfosf2co','review','editorial_board_member','own','published','','2025-11-30T14:14:57.494+00:00','2025-11-30T14:14:57.494+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02f00d7z27035gdwonm','view','editorial_board_member','any','published','','2025-11-30T14:14:57.495+00:00','2025-11-30T14:14:57.495+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02g00d8z270l8aen7j2','create','editorial_board_member','any','published','','2025-11-30T14:14:57.496+00:00','2025-11-30T14:14:57.496+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02h00d9z270you31hrd','update','editorial_board_member','any','published','','2025-11-30T14:14:57.497+00:00','2025-11-30T14:14:57.497+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02i00daz2700mbzkpc4','delete','editorial_board_member','any','published','','2025-11-30T14:14:57.498+00:00','2025-11-30T14:14:57.498+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02j00dbz270ricvk1ya','publish','editorial_board_member','any','published','','2025-11-30T14:14:57.499+00:00','2025-11-30T14:14:57.499+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02k00dcz270jfunfn59','retract','editorial_board_member','any','published','','2025-11-30T14:14:57.500+00:00','2025-11-30T14:14:57.500+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02l00ddz270lmb6919b','archive','editorial_board_member','any','published','','2025-11-30T14:14:57.501+00:00','2025-11-30T14:14:57.501+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02l00dez270s0xdsgam','restore','editorial_board_member','any','published','','2025-11-30T14:14:57.501+00:00','2025-11-30T14:14:57.501+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02m00dfz270b2w4uhk1','review','editorial_board_member','any','published','','2025-11-30T14:14:57.502+00:00','2025-11-30T14:14:57.502+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02n00dgz270adoccdl0','view','editorial_board_member','own','archived','','2025-11-30T14:14:57.503+00:00','2025-11-30T14:14:57.503+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02n00dhz270t3shcsis','create','editorial_board_member','own','archived','','2025-11-30T14:14:57.503+00:00','2025-11-30T14:14:57.503+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02o00diz270cdcsin4a','update','editorial_board_member','own','archived','','2025-11-30T14:14:57.504+00:00','2025-11-30T14:14:57.504+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02p00djz270c4ysghhi','delete','editorial_board_member','own','archived','','2025-11-30T14:14:57.505+00:00','2025-11-30T14:14:57.505+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02p00dkz270mgu2cllb','publish','editorial_board_member','own','archived','','2025-11-30T14:14:57.505+00:00','2025-11-30T14:14:57.505+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02q00dlz270gr8lumuu','retract','editorial_board_member','own','archived','','2025-11-30T14:14:57.506+00:00','2025-11-30T14:14:57.506+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02r00dmz2702miwkccp','archive','editorial_board_member','own','archived','','2025-11-30T14:14:57.507+00:00','2025-11-30T14:14:57.507+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02s00dnz270wn3ljho4','restore','editorial_board_member','own','archived','','2025-11-30T14:14:57.508+00:00','2025-11-30T14:14:57.508+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02s00doz2703n4yqavt','review','editorial_board_member','own','archived','','2025-11-30T14:14:57.508+00:00','2025-11-30T14:14:57.508+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02t00dpz270imlahqpo','view','editorial_board_member','any','archived','','2025-11-30T14:14:57.509+00:00','2025-11-30T14:14:57.509+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02t00dqz270oxsp39rg','create','editorial_board_member','any','archived','','2025-11-30T14:14:57.509+00:00','2025-11-30T14:14:57.509+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02u00drz2708wee141l','update','editorial_board_member','any','archived','','2025-11-30T14:14:57.510+00:00','2025-11-30T14:14:57.510+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02v00dsz270301x2oja','delete','editorial_board_member','any','archived','','2025-11-30T14:14:57.511+00:00','2025-11-30T14:14:57.511+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02v00dtz270zzxb7h9f','publish','editorial_board_member','any','archived','','2025-11-30T14:14:57.511+00:00','2025-11-30T14:14:57.511+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02w00duz270sffsdy7j','retract','editorial_board_member','any','archived','','2025-11-30T14:14:57.512+00:00','2025-11-30T14:14:57.512+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02x00dvz27056j4ku51','archive','editorial_board_member','any','archived','','2025-11-30T14:14:57.513+00:00','2025-11-30T14:14:57.513+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02x00dwz270i70marz9','restore','editorial_board_member','any','archived','','2025-11-30T14:14:57.513+00:00','2025-11-30T14:14:57.513+00:00');
INSERT INTO AuthorPermission VALUES('cmilsy02y00dxz2705xombrc3','review','editorial_board_member','any','archived','','2025-11-30T14:14:57.514+00:00','2025-11-30T14:14:57.514+00:00');

-- Step 3: Assign permissions to roles
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzsi000hz270mwe8c9mo','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzsl000jz270zhhvaart','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzsk000iz270rqqm3h8n','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzsh000gz270r6gpi80z','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzt0000yz270ippn1n0c','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxztw001zz270ts0w6xd7','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxztx0021z2704bnrkgy9','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxztx0020z2701nqtp7xq','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxztv001yz270vjuygpam','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzu8002gz270w7wmhxw8','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzv2003hz2709o2afc7c','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzv4003jz270lzgflz02','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzv3003iz2706zlcizrg','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzv1003gz270osbr2ztg','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzvg003yz27094aba8gx','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzwb004zz270a82mk577','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzwc0051z270o1m6802s','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzwc0050z270l3ikh8le','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzwa004yz270nf72lk8r','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzwn005gz27054t627d8','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzxf006hz270rei0ryaw','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzxh006jz2708x1j744y','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzxg006iz270h578p6cm','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzxe006gz270kqpaajlb','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzxu006yz2706ry0kfl4','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzyj007zz270foewaqm9','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzyk0081z270se7bkz07','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzyj0080z2703qmpd4zt','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzyi007yz270nm2m6qr9','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzyx008gz270km3pn8og','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzzo009hz270xhxpwn6e','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzzp009jz2700hjkyoon','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzzp009iz270tzrrp5sp','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzzn009gz270tw4aefwt','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzzz009yz270lrt82kdb','cm63hi8yr00cj7044fjngq6f4');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzsz000xz270qzwdl98k','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzsp000pz270sbirjf3k','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzt90017z270xsua59du','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzsi000hz270mwe8c9mo','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzsl000jz270zhhvaart','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzsm000kz270mho6av7q','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzsk000iz270rqqm3h8n','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzt60014z2703v4loxf3','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzt50013z270fq65yiio','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzu8002fz270fd8sccbh','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzu10027z27091k1uaha','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzue002pz270x9f2y2l7','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxztw001zz270ts0w6xd7','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxztx0021z2704bnrkgy9','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzty0022z270dgqw18yv','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxztx0020z2701nqtp7xq','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzuc002mz2709b9jff7m','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzub002lz270xdpwneup','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzvf003xz2704ehehkdq','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzv8003pz270zf3xilqi','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzvn0047z270ke0s0fqf','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzv2003hz2709o2afc7c','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzv4003jz270lzgflz02','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzv5003kz270vytle6wi','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzv3003iz2706zlcizrg','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzvl0044z270wd1n7lle','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzvl0043z270w4gjj4gy','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzwm005fz270quxlqpoi','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzwh0057z270k1d8nm1d','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzwv005pz270zpkig6sv','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzwb004zz270a82mk577','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzwc0051z270o1m6802s','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzwd0052z2707u1d25j1','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzwc0050z270l3ikh8le','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzws005mz270n36s6xey','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzwr005lz270xq8cpyxo','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzxt006xz270i0ssj6hy','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzxn006pz270q4u3tyt9','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzy00077z270rrc2xpib','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzxf006hz270rei0ryaw','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzxh006jz2708x1j744y','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzxi006kz270ya9ts1fx','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzxg006iz270h578p6cm','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzxy0074z270rk9hn500','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzxx0073z270vyj53r5c','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzyw008fz270gqnnanxu','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzyo0087z270nwlv58tu','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzz4008pz270xfgx4ox7','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzyj007zz270foewaqm9','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzyk0081z270se7bkz07','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzyl0082z270uqc0oc1b','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzyj0080z2703qmpd4zt','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzz2008mz270x87gibwf','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzz1008lz270efese05w','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzzy009xz27061bh1lmb','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzzt009pz270jguicbph','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsy00600a7z2707yiqjgvs','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzzo009hz270xhxpwn6e','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzzp009jz2700hjkyoon','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzzq009kz2707qsev99x','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzzp009iz270tzrrp5sp','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsy00400a4z270phbndlbe','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsy00300a3z270kwet4qj9','cm63hi8yx00ck7044zgniecm1');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzsq000qz270bfz6y91f','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzss000sz270zt5bunxq','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzst000tz270dsuyk220','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzsz000xz270qzwdl98k','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzsr000rz270lueqoo4j','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzsp000pz270sbirjf3k','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxztd001dz270dbu0bqht','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzt90018z270mwy9tyy3','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxztd001cz2706cchkh3t','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzt90017z270xsua59du','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxztq001sz270vy0r7av1','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxztu001wz2702f94zna0','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzto001pz270eh3few1w','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzu20028z27080bwdn3g','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzu3002az270fsel70qh','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzu5002bz270bdem138v','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzu8002fz270fd8sccbh','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzu30029z270x6am9a19','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzu10027z27091k1uaha','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzui002vz270febvz38a','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzuf002qz270vwv5y0xy','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzuh002uz270yoi0o5lm','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzue002pz270x9f2y2l7','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzuw003az27052rqeuan','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzv0003ez270k2hfq8dq','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzut0037z2706ge28pjn','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzv9003qz2702e4nt63o','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzvb003sz2707nwlmk38','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzvb003tz2707dohiwk9','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzvf003xz2704ehehkdq','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzva003rz27088w71e22','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzv8003pz270zf3xilqi','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzvr004dz270oleslq5w','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzvo0048z270yx22pzmw','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzvq004cz270uez0jtjz','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzvn0047z270ke0s0fqf','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzw3004sz270s9p57roh','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzw8004wz270g0ujoyvb','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzw0004pz270b6race22','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzwi0058z270sqsp1w6k','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzwj005az270lfmatply','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzwk005bz270anfr6k6o','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzwm005fz270quxlqpoi','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzwi0059z2706fw5sxhl','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzwh0057z270k1d8nm1d','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzwz005vz27073zv56od','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzwv005qz270q7ow852z','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzwz005uz270qp7earzf','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzwv005pz270zpkig6sv','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzxa006az270m5aajnmg','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzxd006ez270wbq567fy','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzx80067z270nhji1qil','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzxo006qz270wsunf7d3','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzxq006sz270ser5xfa5','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzxr006tz270umy8ibcq','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzxt006xz270i0ssj6hy','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzxp006rz270uthe0c9c','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzxn006pz270q4u3tyt9','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzy4007dz270jzp0yqfp','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzy10078z270vw1lun5p','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzy4007cz2709zmdi5rj','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzy00077z270rrc2xpib','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzye007sz270z8jhy3u5','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzyh007wz27046ht3scq','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzyc007pz270dhw4tuoo','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzyq0088z270543g0bq0','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzyt008az270s0u6rrpa','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzyu008bz270uweutlkh','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzyw008fz270gqnnanxu','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzys0089z270uneebsl7','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzyo0087z270nwlv58tu','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzz8008vz270zu3jgcca','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzz5008qz270pi3gbfhd','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzz8008uz270ttb4sqkj','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzz4008pz270xfgx4ox7','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzzj009az2705kcbvz3e','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzzm009ez270xunj43fr','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzzh0097z2702zanx3vf','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzzu009qz270vnpebndh','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzzv009sz2701a2uqi1u','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzzw009tz2709e14b9pn','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzzy009xz27061bh1lmb','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzzu009rz2700x7vfngf','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsxzzt009pz270jguicbph','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsy00a00adz270oc64425x','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsy00700a8z270aezuujrx','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsy00900acz27018hapdc7','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsy00600a7z2707yiqjgvs','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsy00o00asz270uuinofqn','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsy00r00awz2707fn76gnk','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsy00l00apz270noja5w5r','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsy01c00bqz270z3vhyste','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsy01d00bsz2701zyg139m','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsy01c00brz270k1fhio4b','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsy01a00bpz270a6s9upgu','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsy02g00d8z270l8aen7j2','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsy02i00daz2700mbzkpc4','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsy02h00d9z270you31hrd','cm63hi8z800cl7044kr38q54w');
INSERT INTO _AuthorPermissionToAuthorRole VALUES('cmilsy02f00d7z27035gdwonm','cm63hi8z800cl7044kr38q54w');

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
