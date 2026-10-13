import { formatArticleCount } from '~/utils/format-article-count'

const pluralRules = new Intl.PluralRules('cs')

type Options = {
  pendingCount: number
  notSubmittedCount: number
  incompleteCount: number
}

type Forms = { one: string; few: string; other: string }

const pick = (count: number, forms: Forms) => {
  const rule = pluralRules.select(count)

  return rule === 'one' ? forms.one : rule === 'few' ? forms.few : forms.other
}

/**
 * The sentences under the bulk publish dialog's list (design 22c), each only
 * when the selection holds such an article. Waiting and not submitted count
 * only the articles that will be published; incomplete ones are skipped and
 * said apart (copy bhmem1jc).
 *
 * @param options - How many of the articles to publish wait for approval, and
 *   how many nobody submitted; how many selected articles are incomplete.
 * @returns `notes` — „1 článek čeká na schválení. Publikováním ho schválíte.“
 *   and „2 články nebyly odeslány ke schválení.“ in one line, or `null`;
 *   `skipped` — „1 článek je neúplný. Přeskočí se.“, or `null`.
 */
export const getBulkPublishNotes = ({
  pendingCount,
  notSubmittedCount,
  incompleteCount,
}: Options) => {
  const sentences = [
    ...(pendingCount === 0
      ? []
      : [
          `${formatArticleCount(pendingCount)} ${pick(pendingCount, {
            few: 'čekají na schválení. Publikováním je schválíte.',
            one: 'čeká na schválení. Publikováním ho schválíte.',
            other: 'čeká na schválení. Publikováním je schválíte.',
          })}`,
        ]),
    ...(notSubmittedCount === 0
      ? []
      : [
          `${formatArticleCount(notSubmittedCount)} ${pick(notSubmittedCount, {
            few: 'nebyly odeslány ke schválení.',
            one: 'nebyl odeslán ke schválení.',
            other: 'nebylo odesláno ke schválení.',
          })}`,
        ]),
  ]

  return {
    notes: sentences.length === 0 ? null : sentences.join(' '),
    skipped:
      incompleteCount === 0
        ? null
        : `${formatArticleCount(incompleteCount)} ${pick(incompleteCount, {
            few: 'jsou neúplné. Přeskočí se.',
            one: 'je neúplný. Přeskočí se.',
            other: 'je neúplných. Přeskočí se.',
          })}`,
  }
}
