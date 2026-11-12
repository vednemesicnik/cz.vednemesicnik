/**
 * The address of the image an element already shows, so the next view can
 * show the same file until its own loads: a gallery tile for the viewer (12b,
 * l18gjrxu), a list's image for the page it opens (18a, u6r1pxsx).
 *
 * @param element - The element holding an `Image` (`picture img`).
 * @returns The `currentSrc` of its photo once it has loaded; `undefined` while
 *   it hasn't, or when it failed.
 */
export const readLoadedImageSource = (element: Element | null | undefined) => {
  const image = element?.querySelector('picture img')

  if (!(image instanceof HTMLImageElement)) return undefined
  if (!image.complete || image.naturalWidth === 0) return undefined

  return image.currentSrc || undefined
}
