import { ASSOCIATION_ID, escapeHtml } from '../mail/association.server.ts'
import type { Preview } from './artwork-files.server.ts'

/**
 * The one-page licence attachment of one artwork, as the script makes it
 * (`SCRIPT__Publication__Artwork_Upload`, `generate-license-pdf.gs`): its code, author and source,
 * the provider, and a preview. Written as HTML that Drive imports into a temporary Doc, which is
 * then exported to PDF; the script builds the same Doc through DocumentApp.
 *
 * An empty author or source is written out as _neuveden_, as in the e-mail's list, so the PDF
 * states what the provider confirmed rather than leaving it out.
 */

export type LicenceDetails = {
  author: string | null
  preview: Preview | null
  providerEmail: string
  providerName: string
  source: string | null
  /** `<sha256><ext>`, the artwork's file on Drive. */
  storedName: string
}

/** The long side of the preview, in pixels: twenty PDFs stay well under the Mailer's 25 MB. */
export const PREVIEW_SIZE = 800

const LABEL = 'font-size:8pt;font-weight:bold;color:#9ca3af;margin:12pt 0 6pt'
const KEY = 'width:120pt;color:#6b7280;padding:2pt 0'
const VALUE = 'font-weight:bold;padding:2pt 0'

function section(label: string, rows: readonly [string, string][]): string {
  let cells = rows
    .map(
      ([key, value]) =>
        `<tr><td style="${KEY}">${escapeHtml(key)}</td><td style="${VALUE}">${escapeHtml(value)}</td></tr>`,
    )
    .join('')
  return `<p style="${LABEL}">${label}</p><table style="border:none;border-collapse:collapse">${cells}</table><hr>`
}

export function licenceHtml(details: LicenceDetails): string {
  let preview =
    details.preview === null
      ? '<p style="color:#9ca3af">[Náhled není k dispozici]</p>'
      : `<p><img src="data:${details.preview.mimeType};base64,${Buffer.from(details.preview.bytes).toString('base64')}" style="max-width:400px;max-height:320px" alt=""></p>`
  return [
    '<!doctype html><html lang="cs"><head><meta charset="utf-8"></head><body>',
    '<h1>Obrazové dílo</h1><hr>',
    section('DÍLO', [
      ['Kód', details.storedName.replace(/\.[^.]+$/, '')],
      ['Autor', details.author || 'neuveden'],
      ['Zdroj', details.source || 'neuveden'],
    ]),
    section('POSKYTOVATEL', [
      ['Jméno', details.providerName],
      ['E-mail', details.providerEmail],
    ]),
    `<p style="${LABEL}">NÁHLED</p>`,
    preview,
    `<p style="font-size:8pt;color:#9ca3af;text-align:center">Vedneměsíčník, z.s.  |  IČO ${ASSOCIATION_ID}</p>`,
    '</body></html>',
  ].join('')
}

/** The temporary Doc's name, which says what it is to anyone who meets it in the bin. */
export function licenceDocName(storedName: string): string {
  return `_tmp_licence_${storedName}`
}
