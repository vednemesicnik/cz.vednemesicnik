import { formatPodcastLastSave } from './format-podcast-last-save'

type Options = {
  /** The labels of the fields that did not save, in the form's order. */
  unsentLabels: readonly string[]
  /** This editor's own last save, `null` when it saved nothing yet. */
  savedAt: Date | null
  now: Date
}

/**
 * The paragraphs of the dialog after a takeover (design 24h; copy utgh1hb7):
 * whether everything saved, which fields did not, and that the podcast only
 * reads now. A cover still uploading or failed counts as unsaved.
 *
 * @param options - The unsent fields, this editor's last save and the moment.
 * @returns One paragraph when everything saved, two when something did not.
 */
export const formatPodcastHoldTakenDescription = ({
  unsentLabels,
  savedAt,
  now,
}: Options): string[] => {
  const lastSave = formatPodcastLastSave(savedAt, now)
  const readOnly = 'Podcast teď můžete jen číst.'

  return unsentLabels.length === 0
    ? [`Všechny změny jsou uložené. ${lastSave} ${readOnly}`]
    : [
        `Některé změny nejsou uložené. Neuložené změny: ${unsentLabels.join(', ')}.`,
        `${lastSave} ${readOnly}`,
      ]
}
