/** The labels the advice tells apart (copy utgh1hb7). */
export const DESCRIPTION_LABEL = 'Popis'
export const COVER_LABEL = 'Obálka'

/**
 * What to do about the unsent changes before the editor's way out (design
 * 24h, 24i; copy utgh1hb7, as ahizoh4o): copy the description, which can be
 * selected; note the other values; and pick a cover that did not save again
 * once the podcast is editable again.
 *
 * @param unsentLabels - The labels of the unsent changes, the cover included.
 * @param lead - The way out the advice comes before: „Před otevřením
 *   detailu“ or „Před načtením aktuální verze“.
 * @returns The advice's sentences; none when nothing is unsent.
 */
export const formatUnsavedPodcastAdvice = (
  unsentLabels: readonly string[],
  lead: string,
): string[] => {
  const hasDescription = unsentLabels.includes(DESCRIPTION_LABEL)
  const hasCover = unsentLabels.includes(COVER_LABEL)
  const hasOthers = unsentLabels.some(
    (label) => label !== DESCRIPTION_LABEL && label !== COVER_LABEL,
  )
  // „ostatní“ only beside a cover that did not save either.
  const others = hasCover ? 'ostatní neuložené' : 'neuložené'

  const advice =
    hasDescription && hasOthers
      ? `${lead} si zkopírujte neuložený popis a poznamenejte ostatní neuložené změny.`
      : hasDescription
        ? `${lead} si zkopírujte neuložený popis.`
        : hasOthers
          ? `${lead} si poznamenejte ${others} změny.`
          : null

  return [
    ...(advice === null ? [] : [advice]),
    ...(hasCover
      ? ['Až bude možné podcast znovu upravovat, vyberte soubor obálky znovu.']
      : []),
  ]
}
