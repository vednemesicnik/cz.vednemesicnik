/**
 * The address of the image a gallery tile already shows, for the viewer to
 * show the same file until its own photo loads (design 12b, l18gjrxu).
 *
 * @param tile - The gallery tile.
 * @returns The `currentSrc` of the tile's photo once it has loaded;
 *   `undefined` while it hasn't, so the viewer shows its placeholder instead.
 */
export const readTileImageSource = (tile: Element | null | undefined) => {
  const image = tile?.querySelector('picture img')

  if (!(image instanceof HTMLImageElement)) return undefined
  if (!image.complete || image.naturalWidth === 0) return undefined

  return image.currentSrc || undefined
}
