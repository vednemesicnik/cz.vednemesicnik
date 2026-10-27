/**
 * The name an episode goes by. A draft with a description or a link may still
 * lack its title, and then it is *Epizoda bez názvu* (copy v0m112v3); the
 * empty draft's editor says *Nová epizoda* instead (27d).
 *
 * @param title - The stored title, empty until the editor types one.
 * @returns The title, or *Epizoda bez názvu* when it is blank.
 */
export const getEpisodeDisplayTitle = (title: string): string =>
  title.trim() === '' ? 'Epizoda bez názvu' : title
