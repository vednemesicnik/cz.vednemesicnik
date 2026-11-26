import type { getIssueRow } from '~/routes/administration/archive/utils/get-issue-row.server'
import type { getArticleRow } from '~/routes/administration/articles/utils/get-article-row.server'
import type { getTaxonomyRow } from '~/routes/administration/articles/utils/get-taxonomy-row.server'
import type { getEpisodeRow } from '~/routes/administration/podcasts/podcast/episodes/utils/get-episode-row.server'
import type { getPodcastRow } from '~/routes/administration/podcasts/utils/get-podcast-row.server'

type Base = {
  /** `type:id`, unique across the dashboard. */
  key: string
  title: string
  detailHref: string
  /** What the row belongs to: an episode's podcast, an issue's order. */
  contextLine: string | null
  authorLine: string
  /** The moment the section orders by, ISO 8601. */
  sortAt: string | null
}

/**
 * A row of the dashboard (design 21a, 21b): the list row of its type, with
 * the type and what the dashboard row shows around it.
 */
export type DashboardItem =
  | (Base & { type: 'article'; row: ReturnType<typeof getArticleRow> })
  | (Base & { type: 'issue'; row: ReturnType<typeof getIssueRow> })
  | (Base & {
      type: 'category' | 'tag'
      row: ReturnType<typeof getTaxonomyRow>
    })
  | (Base & { type: 'podcast'; row: ReturnType<typeof getPodcastRow> })
  | (Base & {
      type: 'episode'
      row: ReturnType<typeof getEpisodeRow>
      podcast: { id: string; slug: string }
    })
