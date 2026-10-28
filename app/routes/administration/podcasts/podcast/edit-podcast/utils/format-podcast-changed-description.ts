import { formatAwayDuration } from '~/utils/autosave/format-away-duration'

import { formatPodcastLastSave } from './format-podcast-last-save'

const MINUTE = 60 * 1000

type Options = {
  /** How long the editor heard nothing from the server. */
  awayMilliseconds: number
  /** This editor's own last save, `null` when it saved nothing yet. */
  savedAt: Date | null
  now: Date
}

/**
 * The text of the dialog after the podcast changed meanwhile (design 24i;
 * copy utgh1hb7): this editor's last save, why its changes did not save, and
 * how long it was without a connection once that was a minute or more.
 *
 * @param options - The silence, this editor's last save and the moment.
 * @returns „Poslední uložení z tohoto editoru dnes v 14:31. Změny z tohoto
 *   editoru se neuložily, aby nepřepsaly mezitím upravený podcast.“
 */
export const formatPodcastChangedDescription = ({
  awayMilliseconds,
  savedAt,
  now,
}: Options) =>
  [
    formatPodcastLastSave(savedAt, now),
    'Změny z tohoto editoru se neuložily, aby nepřepsaly mezitím upravený podcast.',
    ...(awayMilliseconds >= MINUTE
      ? [`Editor byl ${formatAwayDuration(awayMilliseconds)} bez připojení.`]
      : []),
  ].join(' ')
