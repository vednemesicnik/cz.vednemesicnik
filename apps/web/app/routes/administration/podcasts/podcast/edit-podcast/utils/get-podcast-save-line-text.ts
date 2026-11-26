import type { AutosaveStatus } from '~/hooks/use-autosave'
import { formatSavedMoment } from '~/utils/autosave/format-saved-moment'

type Options = {
  status: AutosaveStatus
  /** The podcast's last save, `null` for a new draft nothing saved yet. */
  savedAt: Date | null
  /** Whether the podcast has a cover, saved or on its way. */
  hasCover: boolean
  now: Date
}

/**
 * The line under the podcast editor's heading, the only sign of saving
 * (design 27e, 24e): the last save, with *obálka zatím chybí* after it until
 * the podcast has a cover, which 27i asks for at submit. A new draft says
 * only that nothing saved yet: 27e draws the note after a save.
 *
 * @returns „Zatím neuloženo“, „ukládá se“, „uloženo dnes v 14:02 · obálka
 *   zatím chybí“, „bez připojení · čeká na uložení“ or „Nepodařilo se
 *   uložit.“
 */
export const getPodcastSaveLineText = ({
  status,
  savedAt,
  hasCover,
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
    default: {
      if (savedAt === null) return 'Zatím neuloženo'
      const saved = `uloženo ${formatSavedMoment(savedAt, now)}`
      return hasCover ? saved : `${saved} · obálka zatím chybí`
    }
  }
}
