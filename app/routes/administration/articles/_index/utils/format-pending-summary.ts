import { formatArticleCount } from '~/utils/format-article-count'

const pluralRules = new Intl.PluralRules('cs')

/**
 * The Coordinator's waiting-work link under the headline (design 22a).
 *
 * @param count - The number of articles waiting for approval.
 * @returns „Na schválení čeká 1 článek“, „Na schválení čekají 2 články“,
 *   „Na schválení čeká 5 článků“.
 */
export const formatWaitingWork = (count: number) => {
  const verb = pluralRules.select(count) === 'few' ? 'čekají' : 'čeká'

  return `Na schválení ${verb} ${formatArticleCount(count)}`
}
