import { formatSavedMoment } from '~/utils/autosave/format-saved-moment'

type Options = {
  /** Something the editor had not sent yet when the hold went elsewhere. */
  hasUnsentChanges: boolean
  /** The editor's own last save. */
  savedAt: Date
  now: Date
}

/**
 * The body of *Úpravu přebírá …* (design 24h, copy zqe81r3k): only an editor
 * that provably had nothing waiting says all is saved.
 *
 * @param options - Whether anything stayed unsent, the last save, now.
 * @returns „Všechny změny jsou uložené. Poslední uložení dnes v 14:31. Článek
 *   teď můžete jen číst.“, or „Některé změny se nestihly uložit. …“
 */
export const formatHoldTakenDescription = ({
  hasUnsentChanges,
  savedAt,
  now,
}: Options) => {
  const state = hasUnsentChanges
    ? 'Některé změny se nestihly uložit.'
    : 'Všechny změny jsou uložené.'

  return `${state} Poslední uložení ${formatSavedMoment(savedAt, now)}. Článek teď můžete jen číst.`
}
