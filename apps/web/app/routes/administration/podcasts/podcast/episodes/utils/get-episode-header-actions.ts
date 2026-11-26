import { getHeaderActions } from '../../../../articles/article/_index/utils/get-header-actions'
import type { ArticleAction } from '../../../../articles/utils/article-actions'

type Options = Parameters<typeof getHeaderActions>[0] & {
  isOnWeb: boolean
  isPodcastPublished: boolean
  isPodcastUnpublishedShown: boolean
}

// Until the podcast is published, an episode is neither submitted nor
// published (27f); approving, returning and editing still pass (log 0047).
const NEEDS_PUBLISHED_PODCAST = new Set<ArticleAction>([
  'approve-and-publish',
  'publish',
  'submit',
])

/**
 * An episode's detail header (design 27c, 27f): the article's (07c, 23d), its
 * publish date and the takeover of the edit included. *Zobrazit na webu*
 * only where the public page would open the episode, never a link to a 404
 * (tly4a163). While the podcast is off the web, submit and publish drop out,
 * *Schválit* takes the primary place of *Schválit a publikovat…*, and the
 * podcast's sentence stands in place of the role's (27f).
 *
 * @param options - The episode's state and submission, what the signed-in
 *   author may do with it, whether someone else holds its edit, whether the
 *   web shows it to them, whether its podcast is published, and whether the
 *   podcast's sentence is shown.
 * @returns The primary and outline action, the „⋯“ items in order, and the
 *   key of the sentence shown beside or instead of them.
 */
export const getEpisodeHeaderActions = ({
  isOnWeb,
  isPodcastPublished,
  isPodcastUnpublishedShown,
  ...options
}: Options) => {
  const { menu, outline, primary, sentence } = getHeaderActions(options)
  const isAllowed = (action: ArticleAction | null) =>
    action !== null &&
    (isPodcastPublished || !NEEDS_PUBLISHED_PODCAST.has(action)) &&
    (action !== 'view-on-web' || isOnWeb)

  const keptPrimary = isAllowed(primary) ? primary : null
  const keptOutline = isAllowed(outline) ? outline : null
  // Without Schválit a publikovat…, Schválit beside it takes the primary place.
  const isApprovalPromoted = keptPrimary === null && keptOutline === 'approve'

  return {
    menu: menu.filter(isAllowed),
    outline: isApprovalPromoted ? null : keptOutline,
    primary: isApprovalPromoted ? keptOutline : keptPrimary,
    sentence: isPodcastUnpublishedShown ? null : sentence,
  }
}
