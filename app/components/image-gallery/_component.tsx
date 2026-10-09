import { clsx } from 'clsx'
import { useRef, useState } from 'react'
import {
  type GalleryImage,
  ImageGalleryDialog,
} from '~/components/image-gallery-dialog'
import { ImageGalleryPreview } from '~/components/image-gallery-preview'
import styles from './_styles.module.css'

type Props = {
  images: Array<GalleryImage>
  className?: string
}

/**
 * The gallery under an article: small 3 : 2 tiles, four per row and three below
 * 640 px, and one dialog that opens at the clicked tile and pages through all of
 * them (design 12a/12b). A single image takes one tile in the first column.
 *
 * @param images - In gallery order; the article puts its featured image first.
 */
export const ImageGallery = ({ images, className }: Props) => {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  const handleOpen = (index: number) => {
    setCurrentIndex(index)
    dialogRef.current?.showModal()
  }

  return (
    <>
      <div className={clsx(styles.grid, className)}>
        {images.map((image, index) => (
          <ImageGalleryPreview
            alt={image.alt}
            image={image.sources}
            key={image.id}
            onClick={() => handleOpen(index)}
          />
        ))}
      </div>

      <ImageGalleryDialog
        images={images}
        index={currentIndex}
        onIndexChange={setCurrentIndex}
        ref={dialogRef}
      />
    </>
  )
}
