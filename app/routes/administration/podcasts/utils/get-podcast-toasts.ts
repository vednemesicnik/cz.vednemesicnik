import { FORM_CONFIG } from '~/config/form-config'

/**
 * The toasts that name the podcast, by intent (27b, tly4a163, gzumlpu2); the
 * others stay generic. Retracting says its episodes went too only when it had
 * published ones: drafts and archived episodes were never on the web.
 *
 * @param publishedEpisodeCount - The podcast's published episodes.
 * @returns The toast per intent.
 */
export const getPodcastToasts = (
  publishedEpisodeCount: number,
): Record<string, string> => ({
  [FORM_CONFIG.intent.value.retract]:
    publishedEpisodeCount > 0
      ? 'Podcast stažen z publikace. Z webu zmizely i jeho publikované epizody.'
      : 'Podcast stažen z publikace.',
})
