import {
  ARTICLE_ACTION_LABELS,
  ARTICLE_DIRECT_INTENTS,
  type ArticleAction,
  type HeaderSentence,
} from '../../../../articles/utils/article-actions'

/**
 * An action on an episode, on its detail's header or in its podcast's table
 * (design 27b, 27c, 07c): the article's set, its publish date and the
 * takeover of the edit included.
 */
export type EpisodeAction = ArticleAction

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

// The article's sentences said of an episode, which has one author (27c, copy v0m112v3).
export const EPISODE_HEADER_SENTENCES: Record<HeaderSentence, string> = {
  'not-submitted': 'Epizoda nebyla odeslána ke schválení.',
  'who-approves': 'Schválit může Koordinátor.',
  'who-edits': 'Upravovat mohou autor epizody a Koordinátor.',
  'who-publishes': 'Publikovat může Koordinátor.',
  'who-restores': 'Obnovit epizodu může Koordinátor.',
}

// What the author of a submitted episode reads under its header (27c, copy v0m112v3).
export const EPISODE_SUBMISSION_NOTES = {
  approved:
    'Epizoda je schválená. Publikovat ji může Koordinátor. Před úpravou ji vezměte zpět do konceptu. Schválení se tím zruší.',
  pending:
    'Epizoda čeká na schválení Koordinátorem. Před úpravou ji vezměte zpět do konceptu a po úpravě znovu odešlete ke schválení.',
} as const

// The episode's sentence in Změnit datum publikace?: the podcast's page orders
// by number, only Nejnovější epizody by date (copy v0m112v3).
export const EPISODE_CHANGE_DATE_DESCRIPTION =
  'Datum a čas publikace určují pořadí v sekci Nejnovější epizody.'
