import { formatSavedMoment } from '~/utils/autosave/format-saved-moment'

import { formatUnsavedIssueFields } from './format-unsaved-issue-fields'

type Options = {
  /** The labels of the details that did not save, in the form's order. */
  unsentLabels: readonly string[]
  /** This editor's own last save, `null` when it saved nothing yet. */
  savedAt: Date | null
  now: Date
}

/**
 * The text of *Úpravu přebírá …* in the issue editor (design 24h, 26l; copy
 * ey73zhul), as its paragraphs: whether the details made it, with what did
 * not right after; then this editor's last save and that it only reads now.
 *
 * @returns `['Všechny změny údajů jsou uložené. Poslední uložení údajů z tohoto
 *   editoru dnes v 14:31. Číslo teď můžete jen číst.']`, or with unsent
 *   details `['Některé změny údajů se nestihly uložit. Neuložené změny: Název.',
 *   'Poslední uložení … Číslo teď můžete jen číst.']`.
 */
export const formatIssueHoldTakenDescription = ({
  unsentLabels,
  savedAt,
  now,
}: Options): string[] => {
  const lastSave =
    savedAt === null
      ? 'Údaje z tohoto editoru zatím nebyly uloženy.'
      : `Poslední uložení údajů z tohoto editoru ${formatSavedMoment(savedAt, now)}.`
  const readOnly = 'Číslo teď můžete jen číst.'

  return unsentLabels.length === 0
    ? [`Všechny změny údajů jsou uložené. ${lastSave} ${readOnly}`]
    : [
        `Některé změny údajů se nestihly uložit. ${formatUnsavedIssueFields(unsentLabels)}`,
        `${lastSave} ${readOnly}`,
      ]
}
