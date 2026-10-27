import { getHeaderActions } from '../../../../articles/article/_index/utils/get-header-actions'

type Options = Parameters<typeof getHeaderActions>[0] & {
  isOnWeb: boolean
  isPodcastUnpublishedShown: boolean
}

/**
 * An episode's detail header (design 27c, 27f): the article's (07c, 23d), its
 * publish date and the takeover of the edit included. *Zobrazit na webu*
 * only where the public page would open the episode, never a link to a 404
 * (tly4a163). While the podcast is off the web, its sentence stands in place
 * of the role's (27f).
 *
 * @param options - The episode's state and submission, what the signed-in
 *   author may do with it, whether someone else holds its edit, whether the
 *   web shows it to them, and whether the podcast's sentence is shown.
 * @returns The primary and outline action, the „⋯“ items in order, and the
 *   key of the sentence shown beside or instead of them.
 */
export const getEpisodeHeaderActions = ({
  isOnWeb,
  isPodcastUnpublishedShown,
  ...options
}: Options) => {
  const { menu, outline, primary, sentence } = getHeaderActions(options)

  return {
    menu,
    outline: outline === 'view-on-web' && !isOnWeb ? null : outline,
    primary,
    sentence: isPodcastUnpublishedShown ? null : sentence,
  }
}
