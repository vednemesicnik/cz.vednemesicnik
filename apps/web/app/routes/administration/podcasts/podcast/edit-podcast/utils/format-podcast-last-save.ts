import { formatSavedMoment } from '~/utils/autosave/format-saved-moment'

/**
 * This editor's last save, as the dialogs of a lost hold say it (design 24h,
 * 24i; copy utgh1hb7, as ahizoh4o). A cover upload counts as a save.
 *
 * @param savedAt - This editor's own last save, `null` when it saved nothing.
 * @param now - The moment of the dialog.
 * @returns „Poslední uložení z tohoto editoru dnes v 14:31.“ or „Z tohoto
 *   editoru zatím nebylo nic uloženo.“
 */
export const formatPodcastLastSave = (savedAt: Date | null, now: Date) =>
  savedAt === null
    ? 'Z tohoto editoru zatím nebylo nic uloženo.'
    : `Poslední uložení z tohoto editoru ${formatSavedMoment(savedAt, now)}.`
