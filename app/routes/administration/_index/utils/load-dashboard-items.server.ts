import { href } from 'react-router'

import { buildIssuePermissionWhere } from '~/routes/administration/archive/utils/build-issue-permission-where'
import { findTakenIssueIds } from '~/routes/administration/archive/utils/find-taken-issue-ids.server'
import { getIssueRow } from '~/routes/administration/archive/utils/get-issue-row.server'
import { ISSUE_ROW_SELECT } from '~/routes/administration/archive/utils/issue-row-select'
import { ARTICLE_ROW_SELECT } from '~/routes/administration/articles/utils/article-row-select'
import { buildArticlePermissionWhere } from '~/routes/administration/articles/utils/build-article-permission-where'
import { buildTaxonomyPermissionWhere } from '~/routes/administration/articles/utils/build-taxonomy-permission-where'
import { getArticleRow } from '~/routes/administration/articles/utils/get-article-row.server'
import { getTaxonomyRow } from '~/routes/administration/articles/utils/get-taxonomy-row.server'
import { TAXONOMY_ROW_SELECT } from '~/routes/administration/articles/utils/taxonomy-row-select'
import { buildEpisodePermissionWhere } from '~/routes/administration/podcasts/podcast/episodes/utils/build-episode-permission-where'
import { EPISODE_ROW_SELECT } from '~/routes/administration/podcasts/podcast/episodes/utils/episode-row-select'
import { getEpisodeRow } from '~/routes/administration/podcasts/podcast/episodes/utils/get-episode-row.server'
import { buildPodcastPermissionWhere } from '~/routes/administration/podcasts/utils/build-podcast-permission-where'
import { getPodcastRow } from '~/routes/administration/podcasts/utils/get-podcast-row.server'
import { PODCAST_ROW_SELECT } from '~/routes/administration/podcasts/utils/podcast-row-select'
import { prisma } from '~/utils/db.server'
import { resolveIssueTitles } from '~/utils/issue/resolve-issue-titles.server'
import type { AuthorPermissionContext } from '~/utils/permissions/author/context/get-author-permission-context.server'
import { getPodcastDisplayTitle } from '~/utils/podcast/get-podcast-display-title'
import { formatEpisodeTitle } from '~/utils/podcast-episode/format-episode-title'

import type { DashboardItem } from '../dashboard-item'
import type { DashboardType } from '../dashboard-types'
import {
  buildDashboardSectionWhere,
  type DashboardSelection,
} from './build-dashboard-section-where'
import { mergeDashboardItems } from './merge-dashboard-items'

type Order = {
  field: 'submittedAt' | 'updatedAt' | 'publishedAt'
  direction: 'asc' | 'desc'
}

type Options = {
  context: AuthorPermissionContext
  now: Date
  selection: DashboardSelection
  order: Order
  take?: number
}

const toIso = (date: Date | null) => date?.toISOString() ?? null

/**
 * The dashboard rows of one section across all six types (design 21a, 21b):
 * what the role may view, narrowed to the section's queues (and to one's own
 * content where the section says so), each row built as its list builds it.
 *
 * Lookups that serve only bulk publishing are left out: an address or a
 * number another record holds makes no difference to a single row's
 * actions, except an issue's, whose publish says what it lacks (26e).
 *
 * @param options.context - The author permission context, loaded with every
 *   action on all six entities.
 * @param options.now - The moment of the load.
 * @param options.selection - The section's queues, or the keys of the rows
 *   on screen.
 * @param options.order - The column the section orders by, and its direction.
 * @param options.take - How many rows the section shows at most.
 * @returns The section's rows in its order.
 */
export const loadDashboardItems = async ({
  context,
  now,
  selection,
  order,
  take,
}: Options): Promise<DashboardItem[]> => {
  const authorId = context.authorId

  const sectionWhere = (type: DashboardType, own: object) =>
    buildDashboardSectionWhere(selection, type, own)

  const orderBy = [{ [order.field]: order.direction }, { id: 'asc' as const }]
  const query = { orderBy, take }

  const loadArticles = async () => {
    const where = sectionWhere('article', {
      authors: { some: { id: authorId } },
    })
    if (where === null) return []

    const articles = await prisma.article.findMany({
      ...query,
      select: ARTICLE_ROW_SELECT,
      where: { AND: [buildArticlePermissionWhere(context), where] },
    })

    return articles.map((article): DashboardItem => {
      const row = getArticleRow(article, { context, now })

      return {
        authorLine: row.authorNames.join(', '),
        contextLine: null,
        detailHref: href('/administration/articles/:articleId', {
          articleId: article.id,
        }),
        key: `article:${article.id}`,
        row,
        sortAt: toIso(article[order.field]),
        title: row.title,
        type: 'article',
      }
    })
  }

  const loadIssues = async () => {
    const where = sectionWhere('issue', { authorId })
    if (where === null) return []

    const permissionWhere = buildIssuePermissionWhere(context)
    const issues = await prisma.issue.findMany({
      ...query,
      select: { ...ISSUE_ROW_SELECT, publishedAt: true },
      where: { AND: [permissionWhere, where] },
    })
    const [titledIssues, takenIds] = await Promise.all([
      resolveIssueTitles(issues, permissionWhere),
      findTakenIssueIds(issues),
    ])

    return titledIssues.map((issue): DashboardItem => {
      const row = getIssueRow(issue, {
        context,
        isNumberTaken: takenIds.has(issue.id),
        now,
      })

      return {
        authorLine: issue.author.name,
        // An issue without a name is called by its order; then once is enough.
        contextLine: row.orderLabel === row.title ? null : row.orderLabel,
        detailHref: href('/administration/archive/:issueId', {
          issueId: issue.id,
        }),
        key: `issue:${issue.id}`,
        row,
        sortAt: toIso(issue[order.field]),
        title: row.supplement ?? row.title,
        type: 'issue',
      }
    })
  }

  const loadTaxonomy = async (type: 'category' | 'tag') => {
    const where = sectionWhere(type, { authorId })
    if (where === null) return []

    const entity = type === 'category' ? 'article_category' : 'article_tag'
    const delegate =
      type === 'category' ? prisma.articleCategory : prisma.articleTag
    const permissionWhere = buildTaxonomyPermissionWhere(context, entity)
    // Both delegates take the same arguments; TypeScript can't unite them.
    const findMany = delegate.findMany as typeof prisma.articleCategory.findMany
    const records = await findMany({
      ...query,
      select: { ...TAXONOMY_ROW_SELECT, publishedAt: true },
      where: { AND: [permissionWhere, where] },
    })
    // Every article it has, in any state (25d); `_count` holds one count per
    // relation, so a query of its own.
    const counts = await findMany({
      select: { _count: { select: { articles: true } }, id: true },
      where: { id: { in: records.map((record) => record.id) } },
    })
    const articleCounts = new Map(
      counts.map((record) => [record.id, record._count.articles]),
    )
    const detailHrefOf = (id: string) =>
      type === 'category'
        ? href('/administration/articles/categories/:categoryId', {
            categoryId: id,
          })
        : href('/administration/articles/tags/:tagId', { tagId: id })

    return records.map(
      (record): DashboardItem => ({
        authorLine: record.author.name,
        contextLine: null,
        detailHref: detailHrefOf(record.id),
        key: `${type}:${record.id}`,
        row: getTaxonomyRow(record, {
          articleCount: articleCounts.get(record.id) ?? 0,
          context,
          entity,
        }),
        sortAt: toIso(record[order.field]),
        title: record.name,
        type,
      }),
    )
  }

  const loadPodcasts = async () => {
    const where = sectionWhere('podcast', { authorId })
    if (where === null) return []

    const podcasts = await prisma.podcast.findMany({
      ...query,
      select: { ...PODCAST_ROW_SELECT, publishedAt: true },
      where: { AND: [buildPodcastPermissionWhere(context), where] },
    })
    // Its episodes on the web, which its retract and archive dialogs count.
    const publishedCounts = await prisma.podcastEpisode.groupBy({
      _count: { _all: true },
      by: ['podcastId'],
      where: {
        podcastId: { in: podcasts.map((podcast) => podcast.id) },
        state: 'published',
      },
    })
    const publishedCountByPodcast = new Map(
      publishedCounts.map((group) => [group.podcastId, group._count._all]),
    )

    return podcasts.map((podcast): DashboardItem => {
      const row = getPodcastRow(podcast, {
        context,
        isSlugTaken: false,
        now,
        publishedEpisodeCount: publishedCountByPodcast.get(podcast.id) ?? 0,
      })

      return {
        authorLine: podcast.author.name,
        contextLine: null,
        detailHref: href('/administration/podcasts/:podcastId', {
          podcastId: podcast.id,
        }),
        key: `podcast:${podcast.id}`,
        row,
        sortAt: toIso(podcast[order.field]),
        title: row.title,
        type: 'podcast',
      }
    })
  }

  const loadEpisodes = async () => {
    const where = sectionWhere('episode', { authorId })
    if (where === null) return []

    const episodes = await prisma.podcastEpisode.findMany({
      ...query,
      select: {
        ...EPISODE_ROW_SELECT,
        podcast: { select: { id: true, slug: true, state: true, title: true } },
      },
      where: { AND: [buildEpisodePermissionWhere(context), where] },
    })

    return episodes.map(
      (episode): DashboardItem => ({
        authorLine: episode.author.name,
        contextLine: getPodcastDisplayTitle(episode.podcast.title),
        detailHref: href(
          '/administration/podcasts/:podcastId/episodes/:episodeId',
          { episodeId: episode.id, podcastId: episode.podcast.id },
        ),
        key: `episode:${episode.id}`,
        podcast: { id: episode.podcast.id, slug: episode.podcast.slug },
        row: getEpisodeRow(episode, {
          context,
          isNumberTaken: false,
          isPodcastPublished: episode.podcast.state === 'published',
          isSlugTaken: false,
          now,
        }),
        sortAt: toIso(episode[order.field]),
        title: formatEpisodeTitle(episode),
        type: 'episode',
      }),
    )
  }

  const groups = await Promise.all([
    loadArticles(),
    loadEpisodes(),
    loadPodcasts(),
    loadIssues(),
    loadTaxonomy('category'),
    loadTaxonomy('tag'),
  ])

  return mergeDashboardItems(groups, { direction: order.direction, take })
}
