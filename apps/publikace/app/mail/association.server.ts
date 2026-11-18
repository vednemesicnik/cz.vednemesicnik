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
 * e-mail came.
 */
export function houseEnding(ending: { question: string; reason: string; signOff: string }): string {
  return [
    `<p style="margin:24px 0 0;font-size:15px;line-height:1.6">${escapeHtml(ending.signOff)}</p>`,
    `<p style="margin:0 0 24px;font-size:15px;line-height:1.6;font-weight:600">Vedneměsíčník</p>`,
    `<p style="${SMALL_STYLE}">${escapeHtml(ending.question)}</p>`,
    `<p style="${SMALL_STYLE}">${escapeHtml(ASSOCIATION_NAME)} IČO: ${ASSOCIATION_ID}</p>`,
    `<p style="${SMALL_STYLE}">${escapeHtml(ending.reason)}</p>`,
  ].join('')
}

/** The document around a body, with the subject as its title. */
export function htmlDocument(subject: string, body: string): string {
  return `<!doctype html><html lang="cs"><head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head><body style="margin:0;padding:24px;font-family:Inter,Arial,sans-serif">${body}</body></html>`
}
