/**
 * The name a podcast goes by. A draft with a description or a cover may still
 * lack its title, and then it is *Podcast bez názvu* (copy utgh1hb7); the
 * empty draft's editor says *Nový podcast* instead (27e).
 *
 * @param title - The stored title, empty until the editor types one.
 * @returns The title, or *Podcast bez názvu* when it is blank.
 */
export const getPodcastDisplayTitle = (title: string): string =>
  title.trim() === '' ? 'Podcast bez názvu' : title
