/**
 * The gallery's count, in the panel and on the phone's row (design 24b, 24f).
 * Only images picked in this opening of the editor are processing.
 *
 * @param count - The tiles in the gallery.
 * @param processingCount - Those still being processed.
 * @returns „3“, „3 · ve zpracování: 1“, or „—“ without images.
 */
export const formatGallerySummary = (
  count: number,
  processingCount: number,
): string => {
  if (count === 0) return '—'
  return processingCount === 0
    ? String(count)
    : `${count} · ve zpracování: ${processingCount}`
}
