/**
 * A label or a query folded for a search in a filter menu (design 22d): no
 * case, no diacritics, so „skola“ finds „Škola“.
 *
 * @param text - The text to fold.
 * @returns The folded text.
 */
export const foldForSearch = (text: string) =>
  text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('cs')
