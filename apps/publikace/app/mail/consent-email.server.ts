import { consentIdempotencyKey, consentSubject } from '../domain/artwork.ts'
import {
  ASSOCIATION_ID,
  escapeHtml,
  houseEnding,
  htmlDocument,
  PARAGRAPH_STYLE,
  SENDER_NAME,
} from './association.server.ts'
import type { MailAttachment, MailMessage } from './mailer.server.ts'

/**
 * The consent request a provider gets for one batch (`21c`): the licence terms in the body, in a
 * frame of their own, and one licence PDF per artwork attached.
 *
 * **The terms are a contract and stay word for word as the script sends them**
 * (`SCRIPT__Publication__Artwork_Upload/consent-email.html`), in the same structure: the numbered
 * list with the stored file name, _Autor_, _Zdroj_ and _Ověřovací otisk přílohy_, and the sentence
 * on the attachments below the frame. Only the sentences around them changed, into the formal
 * voice (`mpz96z33`, `zoy6ixjt`).
 *
 * The frame is a border and nothing else: the e-mail sets no text or background colour anywhere,
 * so a client in dark mode has nothing to invert.
 */

export type ConsentArtwork = {
  author: string | null
  /** The licence PDF's SHA-256, which names the attachment and the stored PDF alike. */
  pdfHash: string
  source: string | null
  /** `<sha256><ext>`, the artwork's file on Drive. */
  storedName: string
}

export type ConsentDetails = {
  articleName: string
  artworks: readonly ConsentArtwork[]
  /** The licence PDFs in the artworks' order, base64. */
  attachments: readonly MailAttachment[]
  formKey: string
  issueName: string
  tag: string
  to: string
}

export const CONSENT_QUESTION_LINE = 'Máte dotaz? Odpovězte na tento e-mail.'
export const CONSENT_REASON_LINE =
  'Tento e-mail jste obdrželi na základě nahrání obrazových děl pro Vedneměsíčník.'

const FRAME = 'border:1px solid #6B7280;border-radius:8px;padding:16px;margin:0 0 16px'
const TERM = 'margin:0 0 12px;font-size:14px;line-height:1.6'

function artworkList(artworks: readonly ConsentArtwork[]): string {
  return artworks
    .map(
      (artwork, index) =>
        `<p style="margin:10px 0;font-size:14px;line-height:1.6">${index + 1}. <strong>${escapeHtml(artwork.storedName)}</strong><br>` +
        `<span style="font-size:13px">Autor: ${escapeHtml(artwork.author || 'neuveden')}</span><br>` +
        `<span style="font-size:13px;word-break:break-all">Zdroj: ${escapeHtml(artwork.source || 'neuveden')}</span><br>` +
        `<span style="font-size:12px">Ověřovací otisk přílohy: ${escapeHtml(artwork.pdfHash)}</span></p>`,
    )
    .join('')
}

/** The terms, word for word as the script's template has them. */
function terms(issueName: string, artworks: readonly ConsentArtwork[]): string {
  return [
    `<p style="${TERM};font-weight:700">Souhlas s užitím obrazových děl</p>`,
    `<p style="${TERM}">Poskytovatel potvrzuje, že je oprávněn udělit licenci k užití následujících obrazových děl určených k publikaci v časopisu Vedneměsíčník, číslo vydání <strong>${escapeHtml(issueName)}</strong>:</p>`,
    `<div style="margin:0 0 12px 12px">${artworkList(artworks)}</div>`,
    `<p style="${TERM}">a že k dílům neváznou práva třetích osob bránící jejich užití podle této licence.</p>`,
    `<p style="${TERM}">Poskytovatel prohlašuje, že je oprávněn tuto licenci udělit a že v případě, že by se ukázalo, že k dílům váznou práva třetích osob, nese za takovou skutečnost odpovědnost.</p>`,
    `<p style="${TERM}">Poskytovatel tímto uděluje spolku Vedneměsíčník, z. s., IČO ${ASSOCIATION_ID}, bezúplatnou nevýhradní licenci k užití výše uvedených děl pro účely vydávání časopisu Vedneměsíčník, a to v tištěné i digitální podobě, ke zveřejnění na webových stránkách, v online archivu a pro propagaci časopisu, včetně sociálních sítí.</p>`,
    `<p style="${TERM}">Poskytovatel souhlasí s technickými úpravami nezbytnými pro publikaci (ořez, změna rozlišení, barevné korekce), přičemž díla nebudou měněna způsobem snižujícím jejich hodnotu.</p>`,
    `<p style="${TERM}">Poskytovatel prohlašuje, že údaje o autorech uvedené u jednotlivých děl výše jsou správné a že je oprávněn sjednat způsob označení děl uvedený v tomto odstavci. U děl s uvedeným autorem souhlasí s uvedením autora ve znění uvedeném u příslušného díla. U děl označených výše údajem „Autor: neuveden“ souhlasí s jejich užitím bez uvedení autora a prohlašuje, že je oprávněn takové užití sjednat. Tento způsob označení se vztahuje i na další užití děl podle této licence.</p>`,
    `<p style="${TERM}">Licence se poskytuje bez územního omezení a na dobu trvání majetkových autorských práv k dílům.</p>`,
    `<p style="margin:0;font-size:14px;line-height:1.6">Potvrzení souhlasu bude redakcí uchováno jako doklad o udělení licence.</p>`,
  ].join('')
}

export function consentEmail(details: ConsentDetails): MailMessage {
  let subject = consentSubject(details.articleName, details.issueName, details.tag)
  let body = [
    `<p style="${PARAGRAPH_STYLE}">Dobrý den,</p>`,
    `<p style="${PARAGRAPH_STYLE}">v souvislosti s připravovanou publikací vašich obrazových děl v časopisu Vedneměsíčník vás prosíme o potvrzení níže uvedeného souhlasu s jejich užitím.</p>`,
    `<div style="${FRAME}">${terms(details.issueName, details.artworks)}</div>`,
    `<p style="${PARAGRAPH_STYLE}">Přílohy tohoto e-mailu s náhledy děl tvoří nedílnou součást tohoto souhlasu.</p>`,
    `<p style="${PARAGRAPH_STYLE}">Prosím, potvrďte souhlas odpovědí na tento e-mail jediným slovem <strong>„Souhlasím“</strong>.</p>`,
    `<p style="${PARAGRAPH_STYLE}">Takovou odpověď zpracujeme automaticky, jiné znění vyžaduje ruční kontrolu. Pokud máte dotaz nebo připomínku, napište je do odpovědi.</p>`,
    houseEnding({
      question: CONSENT_QUESTION_LINE,
      reason: CONSENT_REASON_LINE,
      signOff: 'Děkujeme.',
    }),
  ].join('')

  return {
    attachments: [...details.attachments],
    htmlBody: htmlDocument(subject, body),
    idempotencyKey: consentIdempotencyKey(details.formKey),
    name: SENDER_NAME,
    subject,
    to: details.to,
  }
}

/** The attachment of one licence PDF, named by its fingerprint as the stored PDF is. */
export function licenceAttachment(pdfHash: string, bytes: Uint8Array): MailAttachment {
  return {
    data: Buffer.from(bytes).toString('base64'),
    filename: `${pdfHash}.pdf`,
    mimeType: 'application/pdf',
  }
}
