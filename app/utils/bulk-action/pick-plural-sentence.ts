import type { PluralSentences } from '~/config/bulk-noun-config'

const pluralRules = new Intl.PluralRules('cs')

/**
 * Picks the sentence that agrees with a count by the Czech plural rule.
 *
 * @param count - The count the sentence follows.
 * @param sentences - The `1`, `2–4` and `5+` forms.
 * @returns `one` for 1, `few` for 2–4, `other` for the rest.
 */
export const pickPluralSentence = (
  count: number,
  sentences: PluralSentences,
) => {
  const rule = pluralRules.select(count)

  return rule === 'one'
    ? sentences.one
    : rule === 'few'
      ? sentences.few
      : sentences.other
}
