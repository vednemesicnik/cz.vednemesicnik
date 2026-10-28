/**
 * The name an article goes by. Without a title it is *Článek bez názvu*
 * everywhere, the empty draft included (design 24a, jri2vk3h; copy a9r24iou).
 *
 * @param title - The stored title, empty until the editor types one.
 * @returns The title, or *Článek bez názvu* when it is blank.
 */
export const getArticleDisplayTitle = (title: string): string =>
  title.trim() === '' ? 'Článek bez názvu' : title
