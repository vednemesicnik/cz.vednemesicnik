import { createPageTitle } from '~/utils/create-page-title'

/**
 * Titles an administration page `{text} | Administrace | Vedneměsíčník` (30a).
 *
 * @param text - The page heading, or the record name on a detail page.
 * @returns The tab title.
 */
export const createAdminPageTitle = (text: string): string =>
  createPageTitle(`${text} | Administrace`)
