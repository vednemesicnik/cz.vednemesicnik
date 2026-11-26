import type { AutosaveStatus } from '~/hooks/use-autosave'
import { formatSavedMoment } from '~/utils/autosave/format-saved-moment'

type Options = {
  status: AutosaveStatus
  /** The issue's last save, `null` for a new draft nothing saved yet. */
  savedAt: Date | null
  now: Date
}

/**
 * The line under the issue editor's heading, the only sign of saving the
 * details (design 26c, 24e; copy yzyd9p1l, ey73zhul). The files have their own
 * line beside it.
 *
 * @returns „Zatím neuloženo“, „ukládá se“, „uloženo dnes v 14:02“, „bez
 *   připojení · čeká na uložení“ or „Nepodařilo se uložit.“
 */
export const getIssueSaveLineText = ({
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
