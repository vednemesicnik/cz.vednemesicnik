import { clsx } from 'clsx'
import { type ReactNode, useRef } from 'react'
import { CloseIcon } from '~/components/icons/close-icon'
import { Image } from '~/components/image'
import type { ImageSources } from '~/utils/image-store/create-image-sources'
import styles from './_styles.module.css'

type Props = {
  alt: string
  className?: string
  description?: ReactNode
  image: ImageSources
}

export const ImageGalleryPreview = ({
  alt,
  className,
  description,
  image,
}: Props) => {
  const dialogRef = useRef<HTMLDialogElement>(null)

  const handleOpen = () => {
    dialogRef.current?.showModal()
  }

  const handleClose = () => {
    dialogRef.current?.close()
  }

  return (
    <>
      <div className={clsx(styles.container, className)}>
        <button
          aria-label={alt}
          className={styles.button}
          onClick={handleOpen}
          type="button"
        >
          <div className={styles.imageWrapper}>
            <Image {...image} alt={alt} sizes={'300px'} />
          </div>
        </button>
      </div>

      <dialog className={styles.dialog} closedby={'any'} ref={dialogRef}>
        <div className={styles.dialogContent}>
          <div className={styles.dialogHeader}>
            <button
              aria-label="Zavřít"
              className={styles.closeButton}
              onClick={handleClose}
              type="button"
            >
              <CloseIcon />
            </button>
          </div>

          <figure className={styles.dialogImageWrapper}>
            <Image
              {...image}
              alt={alt}
              sizes={'(min-width: 56rem) 840px, 100vw'}
            />

            {description && (
              <figcaption className={styles.dialogDescription}>
                {description}
              </figcaption>
            )}
          </figure>
        </div>
      </dialog>
    </>
  )
}
