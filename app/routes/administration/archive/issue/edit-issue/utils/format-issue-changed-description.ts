import { formatAwayDuration } from '~/utils/autosave/format-away-duration'
import { formatSavedMoment } from '~/utils/autosave/format-saved-moment'

const MINUTE = 60 * 1000

type Options = {
  /** How long the editor heard nothing from the server. */
  awayMilliseconds: number
  /** This editor's own last save, `null` when it saved nothing yet. */
  savedAt: Date | null
  now: Date
}

/**
 * The text of *Číslo se mezitím změnilo* (design 24i, copy ey73zhul), without
 * the list and the advice. The silence is left out under a minute, where
 * „bez připojení“ would not be true.
 *
 * @returns „Poslední uložení údajů z tohoto editoru dnes v 14:31. Změny údajů z
 *   tohoto editoru se neuložily, aby nepřepsaly mezitím upravené číslo. Editor
 *   byl přibližně 3 hodiny bez připojení.“
 */
export const formatIssueChangedDescription = ({
  awayMilliseconds,
  savedAt,
  now,
}: Options) =>
  [
    savedAt === null
      ? 'Údaje z tohoto editoru zatím nebyly uloženy.'
      : `Poslední uložení údajů z tohoto editoru ${formatSavedMoment(savedAt, now)}.`,
    'Změny údajů z tohoto editoru se neuložily, aby nepřepsaly mezitím upravené číslo.',
    ...(awayMilliseconds >= MINUTE
      ? [`Editor byl ${formatAwayDuration(awayMilliseconds)} bez připojení.`]
      : []),
  ].join(' ')
