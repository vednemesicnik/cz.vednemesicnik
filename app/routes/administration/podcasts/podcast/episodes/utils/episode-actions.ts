import {
  ARTICLE_ACTION_LABELS,
  ARTICLE_DIRECT_INTENTS,
  type ArticleAction,
} from '../../../../articles/utils/article-actions'

/**
 * An action on an episode in its podcast's table (design 27b, 07c): the
 * article row's set. An episode has no edit hold to take over, and its
 * publish date changes on its own page until 27c is built.
 */
export type EpisodeAction = Exclude<ArticleAction, 'change-date' | 'take-over'>

/** An action that changes the web, confirmed in a dialog first (07c). */
export type EpisodeStateAction = Extract<
  EpisodeAction,
  'approve-and-publish' | 'archive' | 'publish' | 'retract'
>

// The article's labels, dialogs and their dots included (07c).
export const EPISODE_ACTION_LABELS: Record<EpisodeAction, string> =
  ARTICLE_ACTION_LABELS

// The actions that change the state in one click, as on the article.
export const EPISODE_DIRECT_INTENTS: Partial<Record<EpisodeAction, string>> =
  ARTICLE_DIRECT_INTENTS
