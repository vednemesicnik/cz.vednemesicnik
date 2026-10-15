import type { ListNoun } from '~/config/list-noun-config'

const pluralRules = new Intl.PluralRules('cs')

/**
 * Formats a count of records with the Czech plural of the list's noun.
 *
 * @param count - The number of records.
 * @param noun - The list's noun (`CATEGORY_NOUN`, `TAG_NOUN`, …).
 * @returns `1 rubrika`, `2 rubriky`, `5 rubrik`, `0 rubrik`.
 */
export const formatListCount = (count: number, noun: ListNoun) => {
  return `${count.toLocaleString('cs-CZ')} ${noun.countForms[pluralRules.select(count)]}`
}
