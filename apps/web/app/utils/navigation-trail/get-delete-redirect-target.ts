import { FORM_CONFIG } from '~/config/form-config'

/**
 * Where a delete from a record's page goes: back to its list as it was left,
 * with the search, filters, sort and page the page sent (design 30i, 30c),
 * or to the bare list. Only an address of that same list is taken, so the
 * form can't send the redirect anywhere else.
 *
 * @param formData - The delete's form data, with its optional `redirectTo`.
 * @param listPath - The record's list, e.g. `/administration/articles`.
 * @returns The list's address to redirect to.
 */
export const getDeleteRedirectTarget = (
  formData: FormData,
  listPath: string,
) => {
  const target = formData.get(FORM_CONFIG.redirectTo.name)

  // A query from the address bar is encoded: no spaces, no backslashes.
  if (typeof target !== 'string' || /[\s\\]/.test(target)) return listPath

  return target === listPath || target.startsWith(`${listPath}?`)
    ? target
    : listPath
}
