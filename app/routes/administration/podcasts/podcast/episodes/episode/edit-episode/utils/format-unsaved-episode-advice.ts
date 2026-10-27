/** The labels the advice tells apart (copy ahizoh4o). */
export const DESCRIPTION_LABEL = 'Popis'
export const COVER_LABEL = 'Obálka'

/**
 * What to do with the changes that did not save before leaving the editor
 * (design 24h, 24i; copy ahizoh4o), composed from what they are: the
 * description can be copied, the other values noted, a cover picked again.
 *
 * @param unsentLabels - The labels of the unsent changes.
 * @param lead - The step it comes before: „Před otevřením detailu“, „Před
 *   načtením aktuální verze“.
 * @returns The sentences, e.g. `['Před otevřením detailu si zkopírujte
 *   neuložený popis a poznamenejte ostatní neuložené změny.']`; empty when
 *   nothing is unsent.
 */
export const formatUnsavedEpisodeAdvice = (
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
      ? ['Až bude možné epizodu znovu upravovat, vyberte soubor obálky znovu.']
      : []),
  ]
}
