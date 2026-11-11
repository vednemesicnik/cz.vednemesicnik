import { clsx } from 'clsx'
import { useEffect, useRef, useState } from 'react'
import {
  type GalleryImage,
  ImageGalleryDialog,
} from '~/components/image-gallery-dialog'
import { ImageGalleryPreview } from '~/components/image-gallery-preview'
import { useViewerHistory } from '~/hooks/use-viewer-history'
import styles from './_styles.module.css'

type Props = {
  images: Array<GalleryImage>
  className?: string
}

/**
 * The gallery under an article: small 3 : 2 tiles, four per row and three below
 * 640 px, and one dialog that opens at the clicked tile and pages through all of
 * them (design 12a/12b). A single image takes one tile in the first column.
 * Back closes the viewer, and the focus returns to the tile it opened from.
 *
 * @param images - In gallery order; the article puts its featured image first.
 */
export const ImageGallery = ({ images, className }: Props) => {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const tileRefs = useRef<Array<HTMLButtonElement | null>>([])
  const openerIndexRef = useRef(0)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const openViewer = useViewerHistory(dialogRef)

  const handleOpen = (index: number) => {
    openerIndexRef.current = index
    setCurrentIndex(index)
    setIsOpen(true)
    openViewer()
  }

  // Safari doesn't focus a button on click, so the dialog's own return of the
  // focus can land on the page.
  useEffect(() => {
    const dialog = dialogRef.current

    if (dialog === null) return

    const handleClose = () => {
      setIsOpen(false)
      tileRefs.current[openerIndexRef.current]?.focus()
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
        onIndexChange={setCurrentIndex}
        ref={dialogRef}
      />
    </>
  )
}
