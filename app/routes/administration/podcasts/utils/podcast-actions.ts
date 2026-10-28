import { FORM_CONFIG } from '~/config/form-config'

import type { HeaderSentence } from '../../articles/utils/article-actions'
import {
  TAXONOMY_ACTION_LABELS,
  type TaxonomyAction,
} from '../../articles/utils/taxonomy-actions'

/**
 * An action on a podcast in its list row or its page's „⋯“ (design 27a, 27b,
 * 07c): the category's set, without a publish date to pick or an edit hold
 * to take over.
 */
export type PodcastAction = TaxonomyAction

/** An item of the podcast page's „⋯“: Historie first, then its actions (27j). */
export type PodcastMenuItem = PodcastAction | 'history'

// Archivovat… always asks, with or without published episodes (27a,
// fzqkfmeg); Stáhnout z publikace runs at once (27b, tly4a163).
export const PODCAST_ACTION_LABELS: Record<PodcastMenuItem, string> = {
  ...TAXONOMY_ACTION_LABELS,
  archive: 'Archivovat…',
  history: 'Historie',
}

// The issue's sentences said of a podcast, which has one author (27k, copy a9r24iou).
export const PODCAST_HEADER_SENTENCES: Record<HeaderSentence, string> = {
  'not-submitted': 'Podcast není odeslaný ke schválení.',
  'who-approves': 'Schválit může Koordinátor.',
  'who-edits': 'Upravovat mohou autor podcastu a Koordinátor.',
  'who-publishes': 'Publikovat může Koordinátor.',
  'who-restores': 'Obnovit podcast může Koordinátor.',
}

// What the author of a submitted podcast reads under its header (27k, copy a9r24iou).
export const PODCAST_SUBMISSION_NOTES = {
  approved:
    'Podcast je schválený. Publikovat ho může Koordinátor. Před úpravou ho vezměte zpět do konceptu. Schválení se tím zruší.',
  pending:
    'Podcast čeká na schválení Koordinátorem. Před úpravou ho vezměte zpět do konceptu a po úpravě znovu odešlete ke schválení.',
} as const

// Toasts that name the podcast, by intent (27b, tly4a163); the others stay
// generic.
export const PODCAST_TOASTS: Record<string, string> = {
  [FORM_CONFIG.intent.value.retract]:
    'Podcast stažen z publikace. Jeho epizody už nejsou na webu.',
}
