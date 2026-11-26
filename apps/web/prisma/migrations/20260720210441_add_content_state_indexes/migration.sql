-- CreateIndex
CREATE INDEX "Article_state_publishedAt_idx" ON "Article"("state", "publishedAt");

-- CreateIndex
CREATE INDEX "ArticleCategory_state_authorId_idx" ON "ArticleCategory"("state", "authorId");

-- CreateIndex
CREATE INDEX "ArticleTag_state_authorId_idx" ON "ArticleTag"("state", "authorId");

-- CreateIndex
CREATE INDEX "Issue_state_authorId_idx" ON "Issue"("state", "authorId");

-- CreateIndex
CREATE INDEX "Issue_state_releasedAt_idx" ON "Issue"("state", "releasedAt");

-- CreateIndex
CREATE INDEX "PageSEO_state_authorId_idx" ON "PageSEO"("state", "authorId");

-- CreateIndex
CREATE INDEX "Podcast_state_authorId_idx" ON "Podcast"("state", "authorId");

-- CreateIndex
CREATE INDEX "Podcast_state_publishedAt_idx" ON "Podcast"("state", "publishedAt");

-- CreateIndex
CREATE INDEX "PodcastEpisode_state_authorId_idx" ON "PodcastEpisode"("state", "authorId");

-- CreateIndex
CREATE INDEX "PodcastEpisode_state_publishedAt_idx" ON "PodcastEpisode"("state", "publishedAt");
