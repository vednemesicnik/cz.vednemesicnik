import type { ListNoun } from '~/config/list-noun-config'

const pluralRules = new Intl.PluralRules('cs')

/**
 * The work waiting for the Coordinator, as a screen reader hears it on the
 * Stav button (design 22a, cioukqn6; copy ih6ll3r4, vyecwbul).
 *
 * @param count - The number of records waiting for approval.
 * @param noun - The list's noun.
 * @returns `na schválení čeká celkem 1 rubrika`, `… čekají celkem 2 rubriky`,
 *   `… čeká celkem 5 rubrik`.
 */
export const formatPendingSummary = (count: number, noun: ListNoun) => {
  const rule = pluralRules.select(count)
  const verb = rule === 'few' ? 'čekají' : 'čeká'

  return `na schválení ${verb} celkem ${count.toLocaleString('cs-CZ')} ${noun.countForms[rule]}`
}
