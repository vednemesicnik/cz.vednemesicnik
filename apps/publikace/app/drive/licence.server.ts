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

/**
 * The box the preview is drawn in, as the script fits it, so the licence stays one page. Drive's
 * HTML import ignores `max-width` and `max-height` and draws an image at its own size, which puts
 * an 800 px preview on a page of its own; only the `width` and `height` attributes hold.
 */
const PREVIEW_BOX = { height: 320, width: 400 }

type Size = { height: number; width: number }

/**
 * The size an image's own header states, for the formats Drive serves thumbnails in: PNG, JPEG,
 * GIF and WebP. `null` for anything else, or for bytes too short to say.
 */
export function imageSize(bytes: Uint8Array): Size | null {
  let view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let isAt = (offset: number, ...values: number[]) =>
    offset + values.length <= bytes.length &&
    values.every((value, index) => bytes[offset + index] === value)
  let sized = (width: number, height: number) =>
    width > 0 && height > 0 ? { height, width } : null

  if (isAt(0, 0x89, 0x50, 0x4e, 0x47) && bytes.length >= 24) {
    return sized(view.getUint32(16), view.getUint32(20))
  }
  if (isAt(0, 0x47, 0x49, 0x46, 0x38) && bytes.length >= 10) {
    return sized(view.getUint16(6, true), view.getUint16(8, true))
  }
  if (isAt(0, 0x52, 0x49, 0x46, 0x46) && isAt(8, 0x57, 0x45, 0x42, 0x50) && bytes.length >= 30) {
    if (isAt(12, 0x56, 0x50, 0x38, 0x20)) {
      return sized(view.getUint16(26, true) & 0x3fff, view.getUint16(28, true) & 0x3fff)
    }
    if (isAt(12, 0x56, 0x50, 0x38, 0x4c)) {
      let bits = view.getUint32(21, true)
      return sized((bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1)
    }
    if (isAt(12, 0x56, 0x50, 0x38, 0x58)) {
      let width = 1 + (view.getUint16(24, true) | (view.getUint8(26) << 16))
      let height = 1 + (view.getUint16(27, true) | (view.getUint8(29) << 16))
      return sized(width, height)
    }
    return null
  }
  if (isAt(0, 0xff, 0xd8)) {
    /* The size is in the first start-of-frame marker; every other segment says how long it is. */
    let offset = 2
    while (offset + 9 <= bytes.length) {
      if (view.getUint8(offset) !== 0xff) return null
      let marker = view.getUint8(offset + 1)
      let isFrame = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)
      if (isFrame) return sized(view.getUint16(offset + 7), view.getUint16(offset + 5))
      offset += 2 + view.getUint16(offset + 2)
    }
  }
  return null
}

/** The preview's size inside the box, its proportions kept, never larger than it is. */
export function fitPreview(size: Size): Size {
  let scale = Math.min(1, PREVIEW_BOX.width / size.width, PREVIEW_BOX.height / size.height)
  return {
    height: Math.max(1, Math.round(size.height * scale)),
    width: Math.max(1, Math.round(size.width * scale)),
  }
}

function previewImage(preview: Preview): string {
  let size = imageSize(preview.bytes)
  let fitted = size === null ? null : fitPreview(size)
  /* Without a size only the width is set, so a preview of another format still cannot run wider
     than the box. */
  let dimensions =
    fitted === null
      ? `width="${PREVIEW_BOX.width}"`
      : `width="${fitted.width}" height="${fitted.height}"`
  return `<p><img src="data:${preview.mimeType};base64,${Buffer.from(preview.bytes).toString('base64')}" ${dimensions} alt=""></p>`
}

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
      : previewImage(details.preview)
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
