// What the podcast and episode editors say about a cover upload (design 27e,
// 27d, as 26c; copy fmsjg9oc, 2j4knkrm, hx72s8sv), by the content they name.

/** *Zrušit*'s accessible name on the upload row. */
export const CANCEL_COVER_UPLOAD_LABEL = 'Zrušit nahrávání obálky'

/** For a screen reader, once the content loaded again after a cancel. */
export const COVER_UPLOAD_CANCELLED_ANNOUNCEMENT = 'Nahrávání zrušeno.'

/** For a screen reader, a cancel whose replacement had already saved. */
export const COVER_CANCEL_CROSSED_ANNOUNCEMENT = {
  episode:
    'Nová obálka už je uložená u epizody. Nahrávání se nepodařilo zrušit.',
  podcast:
    'Nová obálka už je uložená u podcastu. Nahrávání se nepodařilo zrušit.',
}

/** The close dialog, while it uploads: closing cancels it. */
export const COVER_UPLOADING_SENTENCE =
  'Obálka se ještě nahrává. Po zavření se její nahrávání zruší.'

/** The close dialog, for a replacement still uploading. */
export const ORIGINAL_COVER_STAYS_SENTENCE = {
  episode: 'Původní obálka zůstane u epizody.',
  podcast: 'Původní obálka zůstane u podcastu.',
}

/** The close dialog, once it no longer uploads and failed while it was open. */
export const COVER_FAILED_SENTENCE = 'Obálku se nepodařilo nahrát.'

/** The close dialog, after a failed replacement. */
export const ORIGINAL_COVER_STAYED_SENTENCE = {
  episode: 'Původní obálka zůstala u epizody.',
  podcast: 'Původní obálka zůstala u podcastu.',
}

/** The close dialog, once the upload ended well while it was open. */
export const COVER_UPLOAD_DONE_SENTENCE = 'Nahrávání je dokončeno.'

/**
 * An episode without its own cover, when the podcast has one: what it goes
 * out with after a cancel or a failure (hx72s8sv).
 */
export const EPISODE_PODCAST_COVER_SENTENCE = {
  /** After the cancel or the failure. */
  stayed: 'Epizoda používá obálku podcastu.',
  /** In the close dialog while the cover uploads. */
  uploading: 'Epizoda bude používat obálku podcastu.',
}
