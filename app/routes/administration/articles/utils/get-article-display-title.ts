/**
 * The name an article goes by in the breadcrumbs and the tab title. A new
 * draft has no title yet and is *Nový článek* until it gets one (design 24a).
 *
 * @param title - The stored title, empty for a new draft.
 * @returns The title, or *Nový článek* when it is empty.
 */
export const getArticleDisplayTitle = (title: string): string =>
  title.trim() === '' ? 'Nový článek' : title
