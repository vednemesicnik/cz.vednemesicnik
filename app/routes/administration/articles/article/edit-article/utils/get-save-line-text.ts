import type { AutosaveStatus } from '~/hooks/use-autosave'

import { formatSavedMoment } from '~/utils/autosave/format-saved-moment'

type Options = {
  status: AutosaveStatus
  /** The article's last save. */
  savedAt: Date
  /** No title, text or image in the editor. */
  isEmpty: boolean
  /** The address is taken and was not saved (24d). */
  isSlugUnsaved: boolean
  now: Date
}

/**
 * The line under the editor's heading, the only sign of saving (design 24e,
 * 24d; copy `zqe81r3k`).
 *
 * @param options - The autosave status, the last save, whether the editor is
 *   empty and whether the address was left out, and the current time.
 * @returns „Zatím prázdné“, „ukládá se“, „uloženo dnes v 14:02“ (another day
 *   „uloženo 25. 9. 2026 v 14:02“, with „ · adresa neuložena“ for a taken
 *   address), „bez připojení · čeká na uložení“ or „Nepodařilo se uložit.“
 */
export const getSaveLineText = ({
  status,
  savedAt,
  isEmpty,
  isSlugUnsaved,
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
      if (isEmpty) return 'Zatím prázdné'

      const savedLine = `uloženo ${formatSavedMoment(savedAt, now)}`

      return isSlugUnsaved ? `${savedLine} · adresa neuložena` : savedLine
    }
  }
}
