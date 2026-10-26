import { FORM_CONFIG } from '~/config/form-config'

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

// Toasts that name the podcast, by intent (27b, tly4a163); the others stay
// generic.
export const PODCAST_TOASTS: Record<string, string> = {
  [FORM_CONFIG.intent.value.retract]:
    'Podcast stažen z publikace. Jeho epizody už nejsou na webu.',
}
