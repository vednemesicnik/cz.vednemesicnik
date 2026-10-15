import type { CountForms } from '~/config/list-noun-config'

const pluralRules = new Intl.PluralRules('cs')

/**
 * Formats a count of records with the Czech plural of the list's noun.
 *
 * @param count - The number of records.
 * @param countForms - The list's noun by plural rule (`CATEGORY_NOUN.countForms`, …).
 * @returns `1 rubrika`, `2 rubriky`, `5 rubrik`, `0 rubrik`.
 */
export const formatListCount = (count: number, countForms: CountForms) => {
  return `${count.toLocaleString('cs-CZ')} ${countForms[pluralRules.select(count)]}`
}
