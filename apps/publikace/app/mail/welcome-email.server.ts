import { coauthorLine, OPEN_DOCUMENT_LABEL, UPLOAD_ARTWORKS_LABEL } from '../domain/article.ts'
import {
  escapeHtml,
  houseEnding,
  htmlDocument,
  PARAGRAPH_STYLE,
  SENDER_NAME,
} from './association.server.ts'
import type { MailMessage } from './mailer.server.ts'

/**
 * The welcome e-mail every author of a new article gets (`20d`), formal and in the newsroom's
 * voice, as the copywriter settled it (il3qqrj9; the comments and the hand-over sn7j5h2m; the
 * word _připomínka_ the digest uses, 2yekm0pt; no count of digests, c3ccbgxr).
 *
 * The HTML is written out by hand rather than drawn by the app's components: a mail client reads
 * no stylesheet, so every style is inline. Only the primary button has a colour, the design
 * system's violet with white text. The outline button's text inherits the client's, because a
 * link left without a colour turns the client's link blue.
 */

export { SENDER_NAME }

export type WelcomeDetails = {
  artworksUrl: string
  articleName: string
  coauthors: readonly string[]
  documentUrl: string
  /** The article's form key: unlike its row ID, never given to another article. */
  formKey: string
  issueName: string
  to: string
}

export function welcomeSubject(articleName: string, issueName: string): string {
  return `Článek „${articleName}“ je ve vydání ${issueName}`
}

/**
 * The same article and author always give the same key, so a send retried after a timeout
 * reaches the author once. The key is the form's, because a row ID can come back after a
 * restore and the Mailer would then take a new article's e-mail for one it already sent.
 */
export function welcomeIdempotencyKey(formKey: string, email: string): string {
  return `article-welcome:${formKey}:${email.toLowerCase()}`
}

const PARAGRAPH = PARAGRAPH_STYLE
const NOTE = 'margin:0 0 16px;font-size:14px;line-height:1.6'
const PRIMARY =
  'display:inline-block;padding:10px 16px;border-radius:8px;font-weight:600;font-size:14px;text-decoration:none;background:#7c3aed;color:#ffffff'
const OUTLINE =
  'display:inline-block;padding:10px 16px;border-radius:8px;font-weight:600;font-size:14px;text-decoration:none;border:1px solid #cad5e2;color:inherit'

/* `20d`, the ending as the copywriter settled it (`zoy6ixjt`). */
export const WELCOME_QUESTION_LINE =
  'Dotazy k textu pište přímo do komentářů v dokumentu. S ostatními dotazy se obraťte na šéfredakci.'
export const WELCOME_REASON_LINE =
  'Tento e-mail jste obdrželi na základě adresy uvedené u vašeho jména při založení článku.'

export function welcomeEmail(details: WelcomeDetails): MailMessage {
  let article = escapeHtml(details.articleName)
  let issue = escapeHtml(details.issueName)
  let coauthors = coauthorLine(details.coauthors)

  let body = [
    `<p style="${PARAGRAPH}">Dobrý den,</p>`,
    `<p style="${PARAGRAPH}">článek „${article}“ je zařazený do vydání ${issue}.</p>`,
    coauthors === null ? '' : `<p style="${PARAGRAPH}">${escapeHtml(coauthors)}</p>`,
    `<p style="${PARAGRAPH}">Pište přímo v dokumentu Google. Kdo má dokument otevřený, může v něm komentovat, odpovídat i navrhovat úpravy. Nejčastěji se tak děje při korektuře. Souhrnné upozornění s odkazem do dokumentu vám pošleme e-mailem jen tehdy, když přibudou nové připomínky. Komentáře a odpovědi autorů článku při tom vynecháváme.</p>`,
    `<p style="${PARAGRAPH}"><a href="${escapeHtml(details.documentUrl)}" style="${PRIMARY}">${OPEN_DOCUMENT_LABEL}</a>&nbsp;&nbsp;<a href="${escapeHtml(details.artworksUrl)}" style="${OUTLINE}">${UPLOAD_ARTWORKS_LABEL}</a></p>`,
    `<p style="${NOTE}">Až bude text připravený ke korektuře, dejte prosím vědět šéfredakci. Po korektuře vám pošleme finální verzi a redakční doložku. Pokud s doložkou souhlasíte, odpovězte na e-mail přesně „Souhlasím“.</p>`,
    houseEnding({
      question: WELCOME_QUESTION_LINE,
      reason: WELCOME_REASON_LINE,
      signOff: 'S pozdravem',
    }),
  ].join('')

  return {
    htmlBody: htmlDocument(welcomeSubject(details.articleName, details.issueName), body),
    idempotencyKey: welcomeIdempotencyKey(details.formKey, details.to),
    name: SENDER_NAME,
    subject: welcomeSubject(details.articleName, details.issueName),
    to: details.to,
  }
}
