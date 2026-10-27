import { formatAwayDuration } from '~/utils/autosave/format-away-duration'

import { formatEpisodeLastSave } from './format-episode-last-save'

const MINUTE = 60 * 1000

type Options = {
  /** How long the editor heard nothing from the server. */
  awayMilliseconds: number
  /** This editor's own last save, `null` when it saved nothing yet. */
  savedAt: Date | null
  now: Date
}

/**
 * The text of *Epizoda se mezitím změnila* (design 24i, copy ahizoh4o),
 * without the list and the advice. The silence is left out under a minute,
 * where „bez připojení“ would not be true.
 *
 * @returns „Poslední uložení z tohoto editoru dnes v 14:31. Změny z tohoto
 *   editoru se neuložily, aby nepřepsaly mezitím upravenou epizodu. Editor
 *   byl přibližně 3 hodiny bez připojení.“
 */
export const formatEpisodeChangedDescription = ({
  awayMilliseconds,
  savedAt,
  now,
}: Options) =>
  [
    formatEpisodeLastSave(savedAt, now),
    'Změny z tohoto editoru se neuložily, aby nepřepsaly mezitím upravenou epizodu.',
    ...(awayMilliseconds >= MINUTE
      ? [`Editor byl ${formatAwayDuration(awayMilliseconds)} bez připojení.`]
      : []),
  ].join(' ')
