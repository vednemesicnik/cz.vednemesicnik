import { clsx } from 'clsx'
import { useRef } from 'react'
import { CloseIcon } from '~/components/icons/close-icon'
import { Image } from '~/components/image'
import styles from './_styles.module.css'

type Props = {
  alt: string
  className?: string
  description?: string | null
  src: string
}

export const ImageGalleryPreview = ({
  alt,
  className,
  description,
  src,
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
          aria-label={description || alt}
          className={styles.button}
          onClick={handleOpen}
          type="button"
        >
          <div className={styles.imageWrapper}>
            <Image alt={alt} height={200} src={src} width={300} />
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
            <Image alt={alt} height={560} src={src} width={840} />
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
