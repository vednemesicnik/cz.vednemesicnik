const pluralRules = new Intl.PluralRules('cs')

const DRAFT_FORMS: Record<Intl.LDMLPluralRule, string> = {
  few: 'koncepty',
  many: 'konceptu',
  one: 'koncept',
  other: 'konceptů',
  two: 'konceptů',
  zero: 'konceptů',
}

/**
 * Formats a draft count with the Czech plural of "koncept".
 *
 * @param count - The number of drafts.
 * @returns `1 koncept`, `2 koncepty`, `5 konceptů`, `0 konceptů`.
 */
export const formatDraftCount = (count: number) => {
  return `${count.toLocaleString('cs-CZ')} ${DRAFT_FORMS[pluralRules.select(count)]}`
}
