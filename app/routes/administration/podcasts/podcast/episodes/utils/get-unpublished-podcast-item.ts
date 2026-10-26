import type { ContentState } from '@generated/prisma/enums'

type Options = {
  state: ContentState
  title: string
}

/**
 * Why an episode can be neither submitted nor published while its podcast is
 * off the web (design 27f): the first sentence of 27f's note.
 *
 * @returns `Podcast Přestávka není publikovaný.` for a draft (waiting or
 *   approved too), `Podcast Přestávka je archivovaný.` for an archived one,
 *   nothing for a published one.
 */
export const getUnpublishedPodcastItem = ({
  state,
  title,
}: Options): string | null => {
  if (state === 'published') return null

  return state === 'archived'
    ? `Podcast ${title} je archivovaný.`
    : `Podcast ${title} není publikovaný.`
}
