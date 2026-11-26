import { createAdminPageTitle } from '~/utils/create-admin-page-title'

/**
 * Titles an administration edit page `{name} — úprava | Administrace | Vedneměsíčník` (30a).
 *
 * @param name - The record's stored name, not the one being typed in the form.
 * @returns The tab title.
 */
export const createAdminEditPageTitle = (name: string): string =>
  createAdminPageTitle(`${name} — úprava`)
