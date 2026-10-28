import { formatEpisodeLastSave } from './format-episode-last-save'

type Options = {
  /** The labels of the fields that did not save, in the form's order. */
  unsentLabels: readonly string[]
  /** This editor's own last save, `null` when it saved nothing yet. */
  savedAt: Date | null
  now: Date
}

/**
 * The text of *Úpravu přebírá …* in the episode editor (design 24h; copy
 * ahizoh4o, utgh1hb7), as its paragraphs: whether the changes made it, with
 * what did not right after; then this editor's last save and that it only
 * reads now. The advice follows separately ({@link formatUnsavedEpisodeAdvice}).
 *
 * @returns `['Všechny změny jsou uložené. Poslední uložení z tohoto editoru
 *   dnes v 14:31. Epizodu teď můžete jen číst.']`, or with unsent fields
 *   `['Některé změny nejsou uložené. Neuložené změny: Popis.', 'Poslední
 *   uložení … Epizodu teď můžete jen číst.']`.
 */
export const formatEpisodeHoldTakenDescription = ({
  unsentLabels,
  savedAt,
  now,
}: Options): string[] => {
  const lastSave = formatEpisodeLastSave(savedAt, now)
  const readOnly = 'Epizodu teď můžete jen číst.'

  return unsentLabels.length === 0
    ? [`Všechny změny jsou uložené. ${lastSave} ${readOnly}`]
    : [
        `Některé změny nejsou uložené. Neuložené změny: ${unsentLabels.join(', ')}.`,
        `${lastSave} ${readOnly}`,
      ]
}
