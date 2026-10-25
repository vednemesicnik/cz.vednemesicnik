import type { PodcastAction, PodcastMenuItem } from './podcast-actions'

/**
 * The podcast page's „⋯“ (design 27b, 27j): Historie first in every state,
 * then the podcast's actions. Upravit and Zobrazit na webu are the header's
 * own buttons, so they leave the menu.
 *
 * @param actions - The podcast's actions, as `getPodcastActions` gives them.
 * @returns The menu items in order.
 */
export const getPodcastHeaderMenu = (
  actions: PodcastAction[],
): PodcastMenuItem[] => [
  'history',
  ...actions.filter((action) => action !== 'edit' && action !== 'view-on-web'),
]
