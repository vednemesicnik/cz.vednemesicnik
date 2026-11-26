/**
 * The name an episode goes by. Without a title it is *Epizoda bez názvu*
 * everywhere, the empty draft included (27d, jri2vk3h; copy v0m112v3, a9r24iou).
 *
 * @param title - The stored title, empty until the editor types one.
 * @returns The title, or *Epizoda bez názvu* when it is blank.
 */
export const getEpisodeDisplayTitle = (title: string): string =>
  title.trim() === '' ? 'Epizoda bez názvu' : title
