import { formatArticleCount } from '~/utils/format-article-count'

const pluralRules = new Intl.PluralRules('cs')

/**
 * What the Stav filter's count says to a screen reader (design 22d, ih6ll3r4):
 * every article waiting for approval, whatever the search and the filters.
 *
 * @param count - The number of articles waiting for approval.
 * @returns „na schválení čeká celkem 1 článek“, „na schválení čekají celkem
 *   2 články“, „na schválení čeká celkem 5 článků“.
 */
export const formatPendingSummary = (count: number) => {
  const verb = pluralRules.select(count) === 'few' ? 'čekají' : 'čeká'

  return `na schválení ${verb} celkem ${formatArticleCount(count)}`
}
