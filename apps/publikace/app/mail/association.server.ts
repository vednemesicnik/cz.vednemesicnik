import { keepOneLetterWords } from '../domain/public/typography.ts'

/**
 * The association that publishes the magazine, as its contracts and e-mails name it. The IČO is
 * a public registration number, kept here once rather than in every template, as the scripts keep
 * it in theirs.
 */
export const ASSOCIATION_NAME = 'Vedneměsíčník, z. s.'
export const ASSOCIATION_ID = '22851356'

/** Every e-mail the app sends is signed by the magazine, the same as the scripts sign theirs. */
export const SENDER_NAME = 'Publikace Vedneměsíčník'

/** Escapes text for HTML, so names and addresses a person typed stay text. */
export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

/*
 * The styles every e-mail shares. None sets a text or background colour: what an e-mail does not
 * set, a mail client in dark mode does not have to invert (`20d`, `21c`).
 */
export const PARAGRAPH_STYLE = 'margin:0 0 16px;font-size:15px;line-height:1.6'
export const SMALL_STYLE = 'margin:0 0 8px;font-size:13px;line-height:1.6'

/**
 * The ending of every e-mail, in the shape of the donation confirmation (`mpz96z33`): the sign-off
 * and the magazine's name, the line about questions, the association with its IČO, and why the
 * e-mail came. Every part is the e-mail's own text, so its one-letter words are kept with the next.
 */
export function houseEnding(ending: { question: string; reason: string; signOff: string }): string {
  return [
    `<p style="margin:24px 0 0;font-size:15px;line-height:1.6">${escapeHtml(keepOneLetterWords(ending.signOff))}</p>`,
    `<p style="margin:0 0 24px;font-size:15px;line-height:1.6;font-weight:600">Vedneměsíčník</p>`,
    `<p style="${SMALL_STYLE}">${escapeHtml(keepOneLetterWords(ending.question))}</p>`,
    `<p style="${SMALL_STYLE}">${escapeHtml(ASSOCIATION_NAME)} IČO: ${ASSOCIATION_ID}</p>`,
    `<p style="${SMALL_STYLE}">${escapeHtml(keepOneLetterWords(ending.reason))}</p>`,
  ].join('')
}

/**
 * The magazine's logo at the top of every e-mail, as the magazine's own e-mails carry it (`f1a2evxo`):
 * one address on the magazine's website, so the logo changes everywhere at once. It is a PNG with
 * a transparent ground, so it sets no area a client in dark mode would have to invert.
 */
export const EMAIL_LOGO_URL = 'https://vednemesicnik.cz/images/email-logo.png'

const LOGO = `<img src="${EMAIL_LOGO_URL}" width="36" height="36" alt="Vedneměsíčník" style="display:block;width:36px;height:36px;border:0;margin:0 0 18px">`

/**
 * The document around a body, with the subject as its title and the logo above it. The font is
 * the stack every e-mail of the magazine uses: a mail client loads no web font, so Inter would
 * reach only the few who have it installed.
 */
export function htmlDocument(subject: string, body: string): string {
  return `<!doctype html><html lang="cs"><head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head><body style="margin:0;padding:24px;font-family:'Helvetica Neue',Arial,sans-serif">${LOGO}${body}</body></html>`
}
