/**
 * The name a podcast goes by. Without a title it is *Podcast bez názvu*
 * everywhere, the empty draft included (27e, jri2vk3h; copy a9r24iou).
 *
 * @param title - The stored title, empty until the editor types one.
 * @returns The title, or *Podcast bez názvu* when it is blank.
 */
export const getPodcastDisplayTitle = (title: string): string =>
  title.trim() === '' ? 'Podcast bez názvu' : title
