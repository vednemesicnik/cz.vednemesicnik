import { coauthorLine, OPEN_DOCUMENT_LABEL, UPLOAD_ARTWORKS_LABEL } from '../domain/article.ts'
import type { MailMessage } from './mailer.server.ts'

/**
 * The welcome e-mail every author of a new article gets (`20d`), formal and in the newsroom's
 * voice, as the copywriter settled it (il3qqrj9).
 *
 * The HTML is written out by hand rather than drawn by the app's components: a mail client reads
 * no stylesheet, so every style is inline, and the colours are the design system's values.
 */

export const SENDER_NAME = 'Vedneměsíčník – Publikace'

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

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
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

const PARAGRAPH = 'margin:0 0 16px;font-size:15px;line-height:1.6;color:#121418'
const NOTE = 'margin:0 0 16px;font-size:14px;line-height:1.6;color:#6b7280'
const FOOT = 'margin:24px 0 0;font-size:13px;line-height:1.6;color:#6b7280'
const PRIMARY =
  'display:inline-block;padding:10px 16px;border-radius:8px;font-weight:600;font-size:14px;text-decoration:none;background:#7c3aed;color:#ffffff'
const OUTLINE =
  'display:inline-block;padding:10px 16px;border-radius:8px;font-weight:600;font-size:14px;text-decoration:none;border:1px solid #cad5e2;color:#121418'

export function welcomeEmail(details: WelcomeDetails): MailMessage {
  let article = escapeHtml(details.articleName)
  let issue = escapeHtml(details.issueName)
  let coauthors = coauthorLine(details.coauthors)

  let body = [
    `<p style="${PARAGRAPH}">Dobrý den,</p>`,
    `<p style="${PARAGRAPH}">článek „${article}“ je zařazený do vydání ${issue}.</p>`,
    coauthors === null ? '' : `<p style="${PARAGRAPH}">${escapeHtml(coauthors)}</p>`,
    `<p style="${PARAGRAPH}">Pište přímo v dokumentu Google. Redakce tam může přidávat komentáře. Přehled nových komentářů posíláme e-mailem nejvýš čtyřikrát denně.</p>`,
    `<p style="${PARAGRAPH}"><a href="${escapeHtml(details.documentUrl)}" style="${PRIMARY}">${OPEN_DOCUMENT_LABEL}</a>&nbsp;&nbsp;<a href="${escapeHtml(details.artworksUrl)}" style="${OUTLINE}">${UPLOAD_ARTWORKS_LABEL}</a></p>`,
    `<p style="${NOTE}">Až bude text dopsaný, v dokumentu na počítači vyberte <em>Publikace › Předat ke korektuře</em>. Můžete také dát vědět šéfredakci. Po korektuře vám pošleme finální verzi a redakční doložku. Pokud s doložkou souhlasíte, odpovězte na e-mail přesně „Souhlasím“.</p>`,
    `<p style="${FOOT}">Vedneměsíčník, studentské nekritické noviny · Tento e-mail posíláme na adresu uvedenou u vašeho jména při založení článku.</p>`,
  ].join('')

  return {
    htmlBody: `<!doctype html><html lang="cs"><head><meta charset="utf-8"><title>${escapeHtml(welcomeSubject(details.articleName, details.issueName))}</title></head><body style="margin:0;padding:24px;font-family:Inter,Arial,sans-serif">${body}</body></html>`,
    idempotencyKey: welcomeIdempotencyKey(details.formKey, details.to),
    name: SENDER_NAME,
    subject: welcomeSubject(details.articleName, details.issueName),
    to: details.to,
  }
}
