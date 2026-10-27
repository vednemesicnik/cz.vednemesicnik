import type { AutosaveStatus } from '~/hooks/use-autosave'
import { formatSavedMoment } from '~/utils/autosave/format-saved-moment'

type Options = {
  status: AutosaveStatus
  /** The episode's last save, `null` for a new draft nothing saved yet. */
  savedAt: Date | null
  now: Date
}

/**
 * The line beside the episode editor's tag, the only sign of saving (design
 * 27d, 24e; copy yzyd9p1l).
 *
 * @returns „Zatím neuloženo“, „ukládá se“, „uloženo dnes v 14:02“, „bez
 *   připojení · čeká na uložení“ or „Nepodařilo se uložit.“
 */
export const getEpisodeSaveLineText = ({
  status,
  savedAt,
  now,
}: Options): string => {
  switch (status) {
    case 'failed':
      return 'Nepodařilo se uložit.'
    case 'offline':
      return 'bez připojení · čeká na uložení'
    case 'pending':
    case 'saving':
      return 'ukládá se'
    default:
      return savedAt === null
        ? 'Zatím neuloženo'
        : `uloženo ${formatSavedMoment(savedAt, now)}`
  }
}
