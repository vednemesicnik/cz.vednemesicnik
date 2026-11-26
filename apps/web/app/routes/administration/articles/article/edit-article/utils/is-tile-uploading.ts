import type { GalleryTile } from './use-article-gallery'

/**
 * Whether a gallery tile's file is on its way: a new image, or a stored
 * one's replacement. One step from the pick to the save (24b, bxy8xxqs).
 *
 * @param tile - The tile.
 * @returns Whether it uploads.
 */
export const isTileUploading = (tile: GalleryTile) =>
  tile.status === 'uploading' || tile.replaced !== null
