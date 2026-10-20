// What the issue editor says about its cover and PDF, by the files it names
// (design 26c, 26d; copy yzyd9p1l, fzqkfmeg, 2j4knkrm).

/** After the save line, while they upload. */
export const UPLOADING_LINE = {
  both: 'obálka a PDF se nahrávají',
  cover: 'obálka se nahrává',
  pdf: 'PDF se nahrává',
}

/** The close dialog, while they upload: closing cancels them. */
export const UPLOADING_SENTENCE = {
  both: 'Obálka i PDF se ještě nahrávají. Po zavření se jejich nahrávání zruší.',
  cover: 'Obálka se ještě nahrává. Po zavření se její nahrávání zruší.',
  pdf: 'PDF se ještě nahrává. Po zavření se jeho nahrávání zruší.',
}

/** The close dialog, for the replacements still uploading. */
export const ORIGINAL_STAYS_SENTENCE = {
  both: 'Původní obálka i PDF zůstanou u čísla.',
  cover: 'Původní obálka zůstane u čísla.',
  pdf: 'Původní PDF zůstane u čísla.',
}

/** The close dialog, once none uploads and some failed while it was open. */
export const FAILED_SENTENCE = {
  both: 'Obálku ani PDF se nepodařilo nahrát.',
  cover: 'Obálku se nepodařilo nahrát.',
  pdf: 'PDF se nepodařilo nahrát.',
}

/** After a failed replacement: under the field, and in the close dialog. */
export const ORIGINAL_STAYED_SENTENCE = {
  both: 'Původní obálka i PDF zůstaly u čísla.',
  cover: 'Původní obálka zůstala u čísla.',
  pdf: 'Původní PDF zůstalo u čísla.',
}

/** For a screen reader, a cancel whose replacement had already saved. */
export const CANCEL_CROSSED_ANNOUNCEMENT = {
  cover: 'Nová obálka už je uložená u čísla. Nahrávání se nepodařilo zrušit.',
  pdf: 'Nové PDF už je uložené u čísla. Nahrávání se nepodařilo zrušit.',
}
