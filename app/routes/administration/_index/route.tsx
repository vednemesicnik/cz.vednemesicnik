// noinspection JSUnusedGlobalSymbols

import { href } from 'react-router'

import { AdminHeadline } from '~/components/admin/admin-headline'
import { AdminNavigationCard } from '~/components/admin/admin-navigation-card'
import { AdminNavigationGrid } from '~/components/admin/admin-navigation-grid'
import { AdminPage } from '~/components/admin/admin-page'
import { AdminPendingItem } from '~/components/admin/admin-pending-item'
import { AdminStatCard } from '~/components/admin/admin-stat-card'
import styles from './_styles.module.css'
import type { Route } from './+types/route'

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
            subtext={`${statistics.articles.published} publikováno`}
            value={statistics.articles.total}
          />
          <AdminStatCard
            icon="🎙️"
            label="Podcasty"
            subtext={`${statistics.podcasts.published} publikováno`}
            value={statistics.podcasts.total}
          />
          <AdminStatCard
            icon="🎧"
            label="Epizody"
            subtext={`${statistics.podcastEpisodes.published} publikováno`}
            value={statistics.podcastEpisodes.total}
          />
          <AdminStatCard
            icon="📰"
            label="Vydání"
            subtext={`${statistics.issues.published} publikováno`}
            value={statistics.issues.total}
          />
          <AdminStatCard
            icon="⏳"
            label="Čeká na schválení"
            subtext="konceptů"
            value={pendingReviewItems.totalCount}
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
                author={article.authors.map((a) => a.name).join(', ')}
                date={new Date(article.createdAt)}
                key={article.id}
                title={article.title}
                to={`/administration/articles/article/${article.id}`}
                type="Článek"
              />
            ))}
            {pendingReviewItems.podcasts.map((podcast) => (
              <AdminPendingItem
                author={podcast.author.name}
                date={new Date(podcast.createdAt)}
                key={podcast.id}
                title={podcast.title}
                to={href('/administration/podcasts/:podcastId', {
                  podcastId: podcast.id,
                })}
                type="Podcast"
              />
            ))}
            {pendingReviewItems.podcastEpisodes.map((episode) => (
              <AdminPendingItem
                author={episode.author.name}
                date={new Date(episode.createdAt)}
                key={episode.id}
                title={`${episode.podcast.title} - ${episode.title}`}
                to={href(
                  '/administration/podcasts/:podcastId/episodes/:episodeId',
                  {
                    episodeId: episode.id,
                    podcastId: episode.podcast.id,
                  },
                )}
                type="Epizoda"
              />
            ))}
            {pendingReviewItems.issues.map((issue) => (
              <AdminPendingItem
                author={issue.author.name}
                date={new Date(issue.createdAt)}
                key={issue.id}
                title={issue.label}
                to={href('/administration/archive/:issueId', {
                  issueId: issue.id,
                })}
                type="Vydání"
              />
            ))}
            {pendingReviewItems.articleCategories.map((category) => (
              <AdminPendingItem
                author={category.author.name}
                date={new Date(category.createdAt)}
                key={category.id}
                title={category.name}
                to={`/administration/article-categories/category/${category.id}`}
                type="Kategorie"
              />
            ))}
            {pendingReviewItems.articleTags.map((tag) => (
              <AdminPendingItem
                author={tag.author.name}
                date={new Date(tag.createdAt)}
                key={tag.id}
                title={tag.name}
                to={`/administration/article-tags/tag/${tag.id}`}
                type="Štítek"
              />
            ))}
            {pendingReviewItems.editorialBoardMembers.map((member) => (
              <AdminPendingItem
                author={member.author.name}
                date={new Date(member.createdAt)}
                key={member.id}
                title={member.fullName}
                to={href('/administration/editorial-board/members/:memberId', {
                  memberId: member.id,
                })}
                type="Člen redakce"
              />
            ))}
            {pendingReviewItems.editorialBoardPositions.map((position) => (
              <AdminPendingItem
                author={position.author.name}
                date={new Date(position.createdAt)}
                key={position.id}
                title={position.key}
                to={href(
                  '/administration/editorial-board/positions/:positionId',
                  {
                    positionId: position.id,
                  },
                )}
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
              description="Správa uživatelských účtů"
              icon="👥"
              title="Uživatelé"
              to={href('/administration/users')}
            />
          )}
          {canViewAuthors && (
            <AdminNavigationCard
              description="Správa autorů obsahu"
              icon="✍️"
              title="Autoři"
              to={'/administration/authors'}
            />
          )}
          {canViewArticles && (
            <AdminNavigationCard
              description="Správa článků a blogových příspěvků"
              icon="📝"
              title="Články"
              to={'/administration/articles'}
            />
          )}
          {canViewPodcasts && (
            <AdminNavigationCard
              description="Správa podcastů a epizod"
              icon="🎙️"
              title="Podcasty"
              to={href('/administration/podcasts')}
            />
          )}
          {canViewIssues && (
            <AdminNavigationCard
              description="Správa vydání časopisu"
              icon="📰"
              title="Archiv"
              to={href('/administration/archive')}
            />
          )}
          {(canViewEditorialBoardPositions || canViewEditorialBoardMembers) && (
            <AdminNavigationCard
              description="Správa členů a pozic redakce"
              icon="👔"
              title="Redakce"
              to={href('/administration/editorial-board')}
            />
          )}
          <AdminNavigationCard
            description="Uživatelské nastavení a profil"
            icon="⚙️"
            title="Nastavení"
            to={href('/administration/settings')}
          />
        </AdminNavigationGrid>
      </section>
    </AdminPage>
  )
}

export { loader } from './_loader'
export { meta } from './_meta'
