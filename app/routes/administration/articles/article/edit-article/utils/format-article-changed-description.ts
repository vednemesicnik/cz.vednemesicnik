import { formatAwayDuration } from './format-away-duration'
import { formatSavedMoment } from './format-saved-moment'

const MINUTE = 60 * 1000

type Options = {
  /** How long the editor heard nothing from the server. */
  awayMilliseconds: number
  /** The editor's own last save. */
  savedAt: Date
  now: Date
}

/**
 * The body of *Článek se mezitím změnil* (design 24i, copy zqe81r3k), without
 * the closing advice, which follows the dialog's button. It does not say who
 * edited: the last one need not be who holds it now. The silence is left out
 * under a minute, where „bez připojení“ would not be true.
 *
 * @param options - The silence, the editor's last save, now.
 * @returns „Editor byl 14 minut bez připojení. Poslední uložení dnes v 14:20.
 *   Novější změny z tohoto editoru se neuložily, aby nepřepsaly mezitím
 *   upravený článek.“
 */
export const formatArticleChangedDescription = ({
  awayMilliseconds,
  savedAt,
  now,
}: Options) => {
  const sentences = [
    `Poslední uložení ${formatSavedMoment(savedAt, now)}.`,
    'Novější změny z tohoto editoru se neuložily, aby nepřepsaly mezitím upravený článek.',
  ]

  if (awayMilliseconds >= MINUTE) {
    sentences.unshift(
      `Editor byl ${formatAwayDuration(awayMilliseconds)} bez připojení.`,
    )
  }

  return sentences.join(' ')
}
