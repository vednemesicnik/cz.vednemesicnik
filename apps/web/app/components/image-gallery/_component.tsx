import { clsx } from 'clsx'
import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import {
  type GalleryImage,
  ImageGalleryDialog,
} from '~/components/image-gallery-dialog'
import { ImageGalleryPreview } from '~/components/image-gallery-preview'
import { useViewerHistory } from '~/hooks/use-viewer-history'
import { runViewerTransition } from '~/utils/image-viewer/run-viewer-transition'
import { waitForTileImage } from '~/utils/image-viewer/wait-for-tile-image'
import { focusAfterInput } from '~/utils/input-modality/focus-after-input'
import { readLoadedImageSource } from '~/utils/read-loaded-image-source'
import styles from './_styles.module.css'

type Props = {
  images: Array<GalleryImage>
  className?: string
}

// The least scroll that shows a tile, clear of the header (its
// scroll-margin); none when it is in view.
const revealTile = (tile: HTMLElement | null | undefined) =>
  tile?.scrollIntoView({ behavior: 'instant', block: 'nearest' })

/**
 * The gallery under an article: small 3 : 2 tiles, four per row and three below
 * 640 px, and one dialog that opens at the clicked tile and pages through all of
 * them (design 12a/12b). A single image takes one tile in the first column.
 * The photo grows out of its tile and flies back into the tile of the image
 * open at the close (l18gjrxu), which then has the focus. Back closes the
 * viewer too. The flight assumes one gallery in the document, as an article
 * has; with two it doesn't play.
 *
 * @param images - In gallery order; the article puts its featured image first.
 */
export const ImageGallery = ({ images, className }: Props) => {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const tileRefs = useRef<Array<HTMLButtonElement | null>>([])
  const currentIndexRef = useRef(0)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [tileImageSource, setTileImageSource] = useState<string>()

  const getFrame = () =>
    dialogRef.current?.querySelector<HTMLElement>('[data-viewer-photo]') ?? null

  const showImage = (index: number) => {
    currentIndexRef.current = index
    setCurrentIndex(index)
    setTileImageSource(readLoadedImageSource(tileRefs.current[index]))
  }

  const closeViewer = ({ animate = true }: { animate?: boolean } = {}) => {
    const dialog = dialogRef.current

    if (dialog === null || !dialog.open) return

    // Under the open viewer, so the reader doesn't see the page move.
    revealTile(tileRefs.current[currentIndexRef.current])

    if (!animate) {
      dialog.close()
      return
    }

    runViewerTransition({ kind: 'close', update: () => dialog.close() })
  }

  const openViewer = useViewerHistory(dialogRef, (event) =>
    // A back gesture the browser animated itself closes without a second one.
    closeViewer({ animate: !event.hasUAVisualTransition }),
  )

  const handleOpen = (index: number) => {
    // Current before the transition starts, so its first snapshot names the
    // clicked tile's image.
    flushSync(() => showImage(index))

    runViewerTransition({
      kind: 'open',
      update: async () => {
        flushSync(() => setIsOpen(true))
        openViewer()
        // The dialog, not the ×: Safari shows the focus ring and tooltip of a
        // button focused on open, a tap included.
        dialogRef.current?.focus({ preventScroll: true })
        await waitForTileImage(getFrame())
      },
    })
  }

  // Safari doesn't focus a button on click, so the dialog's own return of the
  // focus can land on the page. The focus goes to the tile the photo went
  // back into, shown first also when the browser closed the viewer itself,
  // with its ring only after the keyboard (30i).
  useEffect(() => {
    const dialog = dialogRef.current

    if (dialog === null) return

    const handleClose = () => {
      setIsOpen(false)
      const tile = tileRefs.current[currentIndexRef.current]
      revealTile(tile)
      if (tile) focusAfterInput(tile)
    }

    dialog.addEventListener('close', handleClose)

    return () => dialog.removeEventListener('close', handleClose)
  }, [])

  return (
    <>
      <div className={clsx(styles.grid, className)}>
        {images.map((image, index) => (
          <ImageGalleryPreview
            alt={image.alt}
            image={image.sources}
            isCurrent={index === currentIndex}
            key={image.id}
            onClick={() => handleOpen(index)}
            ref={(tile) => {
              tileRefs.current[index] = tile
            }}
          />
        ))}
      </div>

      <ImageGalleryDialog
        images={images}
        index={currentIndex}
        isOpen={isOpen}
        onCloseRequest={closeViewer}
        onIndexChange={showImage}
        ref={dialogRef}
        tileImageSource={tileImageSource}
      />
    </>
  )
}
