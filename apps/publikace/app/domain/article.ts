/**
 * Articles (_články_): the record the Doc's scripts read, and the words `20a`–`20d` and the
 * welcome e-mail give them. The form's rules are in `public/article-form.ts`, which the browser
 * loads too, and are re-exported here.
 */

import type { Author } from './public/article-form.ts'

export {
  REQUIRED_LEGEND,
  ARTICLE_NAME_LABEL,
  ARTICLE_NAME_PLACEHOLDER,
  AUTHORS_LEGEND,
  AUTHORS_HINT,
  AUTHOR_NAME_LABEL,
  AUTHOR_NAME_PLACEHOLDER,
  AUTHOR_EMAIL_LABEL,
  AUTHOR_EMAIL_PLACEHOLDER,
  ADD_AUTHOR_LABEL,
  REMOVE_AUTHOR_LABEL,
  CONSENT_SENTENCE,
  CREATE_ARTICLE_LABEL,
  CREATING_ARTICLE_LABEL,
  authorCardTitle,
  removeAuthorName,
  AUTHOR_LIMIT_NOTE,
  checkArticle,
  duplicateEmailMessage,
  EMPTY_ARTICLE_NAME_MESSAGE,
  EMPTY_AUTHOR_EMAIL_MESSAGE,
  EMPTY_AUTHOR_NAME_MESSAGE,
  fieldLabel,
  INVALID_EMAIL_MESSAGE,
  LONG_ARTICLE_NAME_MESSAGE,
  MAX_ARTICLE_NAME_LENGTH,
  MAX_AUTHORS,
  MISSING_AT_MESSAGE,
  summaryTitle,
} from './public/article-form.ts'
export type {
  ArticleCheck,
  ArticleInput,
  Author,
  AuthorInput,
  FieldError,
  FieldKey,
} from './public/article-form.ts'

/* `20a`, as the copywriter settled them (il3qqrj9). */
export const ARTICLE_PAGE_TITLE = 'Nový článek'
export const ARTICLE_PAGE_LEAD =
  'Pro článek vytvoříme dokument Google. V uvítacím e-mailu najdou autoři odkaz na dokument i na nahrání obrazových děl.'
export function issueLine(issueName: string): string {
  return `Vydání ${issueName}`
}

/* The warnings under the lead, checked when the page opens (`20a`; `dkssdpyc`, `1jv85zum`). */
export const ACCOUNT_DISCONNECTED_WARNING =
  'Zkuste článek vytvořit později, nebo dejte vědět šéfredakci.'
export const ARTICLES_FOLDER_GONE_WARNING =
  'Z tohoto odkazu teď nejde založit článek. Šéfredakce vidí problém v aplikaci.'

/* `20c`: a step as the Callout's title, the result under it. */
export type SubmitMessage = { text: string; title: string }

export const LINK_GONE_ON_SUBMIT: SubmitMessage = {
  text: 'Tento odkaz mezitím přestal platit a článek se nevytvořil. Vyplněné údaje jsou stále na této stránce.',
  title: 'Napište šéfredakci o aktuální odkaz.',
}
export const DRIVE_UNAVAILABLE_ON_SUBMIT: SubmitMessage = {
  text: 'Článek se nevytvořil.',
  title: 'Zkuste článek vytvořit za chvíli znovu.',
}
export const LIMIT_REACHED_ON_SUBMIT: SubmitMessage = {
  text: 'Z tohoto odkazu už za poslední hodinu vzniklo 30 článků. Pokud článek potřebujete založit hned, napište šéfredakci.',
  title: 'Zkuste článek vytvořit později.',
}

export const DAILY_CAP_ON_SUBMIT: SubmitMessage = {
  text: 'Dnes už z formulářů Publikace odešlo příliš mnoho e-mailů. Údaje zůstávají ve formuláři.',
  title: 'Zkuste článek vytvořit později.',
}

/** Thirty articles in the last sixty minutes from one link (`02a`, `03` row 15). */
export const SUBMISSIONS_PER_HOUR = 30

/* `20d`. */
export const CREATED_TITLE = 'Článek je založený'

export function createdLead(articleName: string, issueName: string): string {
  return `„${articleName}“ je ve vydání ${issueName}.`
}

/** Only when the welcome e-mail went to every author; otherwise the page says nothing of it. */
export const ALL_WELCOMES_SENT = 'Uvítací e-mail jsme odeslali na všechny uvedené adresy.'
export const OPEN_DOCUMENT_LABEL = 'Otevřít dokument'
export const UPLOAD_ARTWORKS_LABEL = 'Nahrát obrazová díla'
export const WHAT_NEXT_TITLE = 'Co bude dál'
export const WHAT_NEXT_STEPS: readonly string[] = [
  'Píšete v dokumentu, redakce komentuje. Nové komentáře vám přijdou e-mailem nejvýš čtyřikrát denně.',
  'Až text dopíšete, předejte ho ke korektuře: v dokumentu na počítači vyberte Publikace › Předat ke korektuře. Můžete také dát vědět šéfredakci.',
  'Po korektuře přijde e-mail s finální verzí.',
  'Souhlas dáte odpovědí přesně „Souhlasím“.',
]
export const ANOTHER_ARTICLE_LABEL = 'Založit další článek'

/** `Alex Novák`, `Alex Novák a Robin Malá`, `Alex Novák, Robin Malá a Jan Novák`. */
export function joinNames(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? ''
  return `${names.slice(0, -1).join(', ')} a ${names.at(-1)}`
}

/**
 * The welcome e-mail's line about the other authors, or `null` for a single author. The verb
 * follows the count alone: the app knows no gender (`docs/copy-context.md`).
 */
export function coauthorLine(coauthors: readonly string[]): string | null {
  if (coauthors.length === 0) return null
  let verb = coauthors.length === 1 ? 'podílí' : 'podílejí'
  return `Na článku se také ${verb} ${joinNames(coauthors)}.`
}

/** The line under an article's name in the detail (`12a`): its authors. */
export function authorsLine(authors: readonly Pick<Author, 'name'>[]): string {
  return authors.map((author) => author.name).join(', ')
}

/**
 * `_meta.json` in the article folder, in the script's shape: the Doc's menu and the artwork upload
 * read these keys. An issue in the app has no Evidence spreadsheet, so `sheetId` is `null`.
 */
export function articleMeta(article: {
  articleFolderId: string
  articleName: string
  authors: readonly Author[]
  docId: string
  issue: string
  issueFolderId: string
}): string {
  return JSON.stringify({
    docId: article.docId,
    articleName: article.articleName,
    issue: article.issue,
    articleFolderId: article.articleFolderId,
    issueFolderId: article.issueFolderId,
    sheetId: null,
    authors: article.authors.map((author) => ({
      authorName: author.name,
      authorEmail: author.email,
      authorSignature: author.name,
    })),
  })
}

/** The placeholder the template's body carries for the article's name, as the script replaces it. */
export const ARTICLE_NAME_PLACEHOLDER_IN_TEMPLATE = '{{NAZEV_CLANKU}}'

export const META_FILE_NAME = '_meta.json'

export function documentUrl(docId: string): string {
  return `https://docs.google.com/document/d/${encodeURIComponent(docId)}/edit`
}
