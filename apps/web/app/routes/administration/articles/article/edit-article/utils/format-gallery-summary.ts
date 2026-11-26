/**
 * The gallery's count, in the panel and on the phone's row (design 24b, 24f,
 * copy fmsjg9oc). Only images picked in this opening of the editor upload.
 *
 * @param count - The tiles in the gallery.
 * @param uploadingCount - Those still uploading, new and replacements alike.
 * @returns „3“, „4 · nahrává se: 2“, or „—“ without images.
 */
export const formatGallerySummary = (
  count: number,
  uploadingCount: number,
): string => {
  if (count === 0) return '—'
  return uploadingCount === 0
    ? String(count)
    : `${count} · nahrává se: ${uploadingCount}`
}
