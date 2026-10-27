import type { ContentState } from '@generated/prisma/enums'

type Options = {
  isApprover: boolean
  podcastState: ContentState
}

/**
 * The second sentence on the detail of an episode whose podcast is off the
 * web (design 27f, copy w59y90od F): what happens next, by role and by the
 * podcast's state. The first one is `getUnpublishedPodcastItem`'s.
 *
 * @param options - Whether the signed-in author is the Coordinator, and the
 *   podcast's state (draft, waiting and approved alike are a draft).
 * @returns The sentence for the Coordinator of a draft or an archived podcast,
 *   or the one for everyone else.
 */
export const getUnpublishedPodcastAdvice = ({
  isApprover,
  podcastState,
}: Options): string => {
  if (!isApprover) {
    return 'Epizodu můžete odeslat ke schválení, až Koordinátor publikuje podcast.'
  }

  return podcastState === 'archived'
    ? 'Nejprve obnovte podcast jako koncept a publikujte ho. Pak lze epizodu odeslat ke schválení nebo publikovat.'
    : 'Nejprve publikujte podcast. Pak lze epizodu odeslat ke schválení nebo publikovat.'
}
