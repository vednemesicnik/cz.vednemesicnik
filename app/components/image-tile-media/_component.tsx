import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  /** The preview's URL; without one, the signature gradient. */
  source?: string | null
  /** Uploading, from the pick to the save: lightened (24b). */
  isUploading?: boolean
  /** Processing failed: rose, without the image (24b). */
  isFailed?: boolean
  /** The pills, then the „⋯“ (`ImageTilePill`, `ImageTileMenu`). */
  children?: ReactNode
  className?: string
}

/**
 * An image tile's 4 : 3 preview, with its pills and „⋯“ on top. The image is
 * decorative: the alt text stands in the tile's field or line.
 */
export const ImageTileMedia = ({
  source,
  isUploading = false,
  isFailed = false,
  children,
  className,
}: Props) => (
  <div
    className={clsx(
      styles.imageTileMedia,
      !source && styles.empty,
      isUploading && styles.uploading,
      isFailed && styles.failed,
      className,
    )}
  >
    {source && !isFailed && (
      <img
        alt={''}
        className={styles.image}
        // Dragging the preview is no move of the tile.
        draggable={false}
        src={source}
      />
    )}
    {!isFailed && children}
  </div>
)
