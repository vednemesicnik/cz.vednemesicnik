import type { ContentState } from '@generated/prisma/enums'

/**
 * What 27f says of a podcast that is off the web, after its name: the end of
 * the sentence that begins „Podcast Přestávka …“ (copy w59y90od F).
 *
 * @param state - The podcast's state; a waiting or an approved one is a draft.
 * @returns `není publikovaný.` for a draft, `je archivovaný.` for an archived
 *   one, nothing for a published one.
 */
export const getUnpublishedPodcastPredicate = (
  state: ContentState,
): string | null => {
  switch (state) {
    case 'published':
      return null
    case 'archived':
      return 'je archivovaný.'
    case 'draft':
      return 'není publikovaný.'
  }
}
