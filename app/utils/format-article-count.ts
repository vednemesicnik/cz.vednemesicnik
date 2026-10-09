const pluralRules = new Intl.PluralRules('cs')

const ARTICLE_FORMS: Record<Intl.LDMLPluralRule, string> = {
  few: 'články',
  many: 'článku',
  one: 'článek',
  other: 'článků',
  two: 'článků',
  zero: 'článků',
}

/**
 * Formats an article count with the Czech plural of "článek".
 *
 * @param count - The number of articles.
 * @returns `1 článek`, `2 články`, `5 článků`, `0 článků`.
 */
export const formatArticleCount = (count: number) => {
  return `${count.toLocaleString('cs-CZ')} ${ARTICLE_FORMS[pluralRules.select(count)]}`
}
