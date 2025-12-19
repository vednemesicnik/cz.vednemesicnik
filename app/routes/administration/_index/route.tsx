// noinspection JSUnusedGlobalSymbols

import { href } from "react-router"

import { AdminHeadline } from "~/components/admin-headline"
import { AdminNavigationCard } from "~/components/admin-navigation-card"
import { AdminNavigationGrid } from "~/components/admin-navigation-grid"
import { AdminPage } from "~/components/admin-page"
import { AdminPendingItem } from "~/components/admin-pending-item"
import { AdminStatCard } from "~/components/admin-stat-card"

import type { Route } from "./+types/route"
import styles from "./_styles.module.css"

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const { pendingReviewItems, statistics, permissions } = loaderData

  const {
    canViewUsers,
    canViewAuthors,
    canViewArticles,
    canViewPodcasts,
    canViewIssues,
    canViewEditorialBoardPositions,
    canViewEditorialBoardMembers,
  } = permissions

  const hasDisplayedPendingItems =
    pendingReviewItems.articles.length > 0 ||
    pendingReviewItems.podcasts.length > 0 ||
    pendingReviewItems.podcastEpisodes.length > 0 ||
    pendingReviewItems.issues.length > 0 ||
    pendingReviewItems.articleCategories.length > 0 ||
    pendingReviewItems.articleTags.length > 0 ||
    pendingReviewItems.editorialBoardMembers.length > 0 ||
    pendingReviewItems.editorialBoardPositions.length > 0

  return (
    <AdminPage>
      <AdminHeadline>Přehled</AdminHeadline>

      {/* Statistics Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Statistiky</h2>
        <div className={styles.statsGrid}>
          <AdminStatCard
            icon="📝"
            label="Články"
            value={statistics.articles.total}
            subtext={`${statistics.articles.published} publikováno`}
          />
          <AdminStatCard
            icon="🎙️"
            label="Podcasty"
            value={statistics.podcasts.total}
            subtext={`${statistics.podcasts.published} publikováno`}
          />
          <AdminStatCard
            icon="🎧"
            label="Epizody"
            value={statistics.podcastEpisodes.total}
            subtext={`${statistics.podcastEpisodes.published} publikováno`}
          />
          <AdminStatCard
            icon="📰"
            label="Vydání"
            value={statistics.issues.total}
            subtext={`${statistics.issues.published} publikováno`}
          />
          <AdminStatCard
            icon="⏳"
            label="Čeká na schválení"
            value={pendingReviewItems.totalCount}
            subtext="konceptů"
          />
        </div>
      </section>

      {/* Pending Review Section */}
      {hasDisplayedPendingItems && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Čeká na schválení</h2>
          <div className={styles.pendingList}>
            {pendingReviewItems.articles.map((article) => (
              <AdminPendingItem
                key={article.id}
                to={`/administration/articles/article/${article.id}`}
                title={article.title}
                author={article.author.name}
                date={new Date(article.createdAt)}
                type="Článek"
              />
            ))}
            {pendingReviewItems.podcasts.map((podcast) => (
              <AdminPendingItem
                key={podcast.id}
                to={href("/administration/podcasts/:podcastId", {
                  podcastId: podcast.id,
                })}
                title={podcast.title}
                author={podcast.author.name}
                date={new Date(podcast.createdAt)}
                type="Podcast"
              />
            ))}
            {pendingReviewItems.podcastEpisodes.map((episode) => (
              <AdminPendingItem
                key={episode.id}
                to={href(
                  "/administration/podcasts/:podcastId/episodes/:episodeId",
                  {
                    podcastId: episode.podcast.id,
                    episodeId: episode.id,
                  }
                )}
                title={`${episode.podcast.title} - ${episode.title}`}
                author={episode.author.name}
                date={new Date(episode.createdAt)}
                type="Epizoda"
              />
            ))}
            {pendingReviewItems.issues.map((issue) => (
              <AdminPendingItem
                key={issue.id}
                to={href("/administration/archive/:issueId", {
                  issueId: issue.id,
                })}
                title={issue.label}
                author={issue.author.name}
                date={new Date(issue.createdAt)}
                type="Vydání"
              />
            ))}
            {pendingReviewItems.articleCategories.map((category) => (
              <AdminPendingItem
                key={category.id}
                to={`/administration/article-categories/category/${category.id}`}
                title={category.name}
                author={category.author.name}
                date={new Date(category.createdAt)}
                type="Kategorie"
              />
            ))}
            {pendingReviewItems.articleTags.map((tag) => (
              <AdminPendingItem
                key={tag.id}
                to={`/administration/article-tags/tag/${tag.id}`}
                title={tag.name}
                author={tag.author.name}
                date={new Date(tag.createdAt)}
                type="Štítek"
              />
            ))}
            {pendingReviewItems.editorialBoardMembers.map((member) => (
              <AdminPendingItem
                key={member.id}
                to={href(
                  "/administration/editorial-board/members/:memberId",
                  {
                    memberId: member.id,
                  }
                )}
                title={member.fullName}
                author={member.author.name}
                date={new Date(member.createdAt)}
                type="Člen redakce"
              />
            ))}
            {pendingReviewItems.editorialBoardPositions.map((position) => (
              <AdminPendingItem
                key={position.id}
                to={href(
                  "/administration/editorial-board/positions/:positionId",
                  {
                    positionId: position.id,
                  }
                )}
                title={position.key}
                author={position.author.name}
                date={new Date(position.createdAt)}
                type="Pozice"
              />
            ))}
          </div>
        </section>
      )}

      {/* Navigation Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Správa obsahu</h2>
        <AdminNavigationGrid>
          {canViewUsers && (
            <AdminNavigationCard
              to={href("/administration/users")}
              title="Uživatelé"
              description="Správa uživatelských účtů"
              icon="👥"
            />
          )}
          {canViewAuthors && (
            <AdminNavigationCard
              to={"/administration/authors"}
              title="Autoři"
              description="Správa autorů obsahu"
              icon="✍️"
            />
          )}
          {canViewArticles && (
            <AdminNavigationCard
              to={"/administration/articles"}
              title="Články"
              description="Správa článků a blogových příspěvků"
              icon="📝"
            />
          )}
          {canViewPodcasts && (
            <AdminNavigationCard
              to={href("/administration/podcasts")}
              title="Podcasty"
              description="Správa podcastů a epizod"
              icon="🎙️"
            />
          )}
          {canViewIssues && (
            <AdminNavigationCard
              to={href("/administration/archive")}
              title="Archiv"
              description="Správa vydání časopisu"
              icon="📰"
            />
          )}
          {(canViewEditorialBoardPositions || canViewEditorialBoardMembers) && (
            <AdminNavigationCard
              to={href("/administration/editorial-board")}
              title="Redakce"
              description="Správa členů a pozic redakce"
              icon="👔"
            />
          )}
          <AdminNavigationCard
            to={href("/administration/settings")}
            title="Nastavení"
            description="Uživatelské nastavení a profil"
            icon="⚙️"
          />
        </AdminNavigationGrid>
      </section>
    </AdminPage>
  )
}

export { loader } from "./_loader"
export { meta } from "./_meta"
