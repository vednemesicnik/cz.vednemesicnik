import { ARTICLE_NOUN } from '~/config/list-noun-config'

const pluralRules = new Intl.PluralRules('cs')

/**
 * Formats an article count with the Czech plural of "článek".
 *
 * @param count - The number of articles.
 * @returns `1 článek`, `2 články`, `5 článků`, `0 článků`.
 */
export const formatArticleCount = (count: number) => {
  return `${count.toLocaleString('cs-CZ')} ${ARTICLE_NOUN.countForms[pluralRules.select(count)]}`
}
