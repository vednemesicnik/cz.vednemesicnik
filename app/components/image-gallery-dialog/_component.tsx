import { clsx } from 'clsx'
import {
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
} from 'react'
import { CloseIcon } from '~/components/icons/close-icon'
import { KeyboardArrowLeftIcon } from '~/components/icons/keyboard-arrow-left-icon'
import { KeyboardArrowRightIcon } from '~/components/icons/keyboard-arrow-right-icon'
import { Image } from '~/components/image'
import type { ImageSources } from '~/utils/image-store/create-image-sources'
import styles from './_styles.module.css'

export type GalleryImage = {
  id: string
  alt: string
  description?: ReactNode
  sources: ImageSources
}

type Props = {
  images: Array<GalleryImage>
  index: number
  onIndexChange: (index: number) => void
  ref: RefObject<HTMLDialogElement | null>
  className?: string
}

type Point = {
  x: number
  y: number
}

// The shortest horizontal swipe that pages, in CSS pixels.
const SWIPE_DISTANCE = 50

/**
 * One dialog for the whole gallery (design 12b): the image whole, its caption, the
 * counter *n z N*, and paging by arrows, ← → and a swipe. It pages round from the last
 * image to the first and back; with a single image it has no arrows (m8ei8fno).
 *
 * The parent opens it with `ref.current.showModal()`. It closes by the ×, Esc and a
 * click outside; `closedby="any"` covers the last two, with a click fallback for
 * browsers without `closedby` (Safari).
 *
 * @param index - The image shown; the parent owns it, so a tile can open the dialog
 *   at its own image.
 * @param onIndexChange - Called with the next index when the reader pages.
 */
export const ImageGalleryDialog = ({
  images,
  index,
  onIndexChange,
  ref,
  className,
}: Props) => {
  const swipeStartRef = useRef<Point | null>(null)

  const count = images.length
  const hasPaging = count > 1
  const image = images[index] ?? images[0]

  useEffect(() => {
    const dialog = ref.current

    if (dialog === null || 'closedBy' in HTMLDialogElement.prototype) return

    // Without `closedby`, a click on the backdrop targets the dialog itself.
    const handleClick = (event: MouseEvent) => {
      if (event.target !== dialog) return

      const rectangle = dialog.getBoundingClientRect()
      const isInside =
        rectangle.top <= event.clientY &&
        event.clientY <= rectangle.bottom &&
        rectangle.left <= event.clientX &&
        event.clientX <= rectangle.right

      if (!isInside) dialog.close()
    }

    dialog.addEventListener('click', handleClick)

    return () => dialog.removeEventListener('click', handleClick)
  }, [ref])

  const showPrevious = () => onIndexChange((index - 1 + count) % count)
  const showNext = () => onIndexChange((index + 1) % count)
  const handleClose = () => ref.current?.close()

  const handleKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (!hasPaging) return

    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      showPrevious()
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      showNext()
    }
  }

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') return

    swipeStartRef.current = { x: event.clientX, y: event.clientY }
  }

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = swipeStartRef.current
    swipeStartRef.current = null

    if (start === null || !hasPaging) return

    const distanceX = event.clientX - start.x
    const distanceY = event.clientY - start.y

    if (
      Math.abs(distanceX) < SWIPE_DISTANCE ||
      Math.abs(distanceX) <= Math.abs(distanceY)
    ) {
      return
    }

    if (distanceX < 0) {
      showNext()
    } else {
      showPrevious()
    }
  }

  const handlePointerCancel = () => {
    swipeStartRef.current = null
  }

  return (
    <dialog
      aria-label={'Galerie'}
      className={clsx(styles.dialog, className)}
      closedby={'any'}
      onKeyDown={handleKeyDown}
      ref={ref}
    >
      {image && (
        <div className={styles.panel}>
          <div className={styles.header}>
            <span aria-live={'polite'} className={styles.counter}>
              {index + 1} z {count}
            </span>
            <button
              aria-label={'Zavřít galerii'}
              className={styles.closeButton}
              onClick={handleClose}
              type={'button'}
            >
              <CloseIcon />
            </button>
          </div>

          <figure className={styles.figure}>
            <div
              className={styles.stage}
              onPointerCancel={handlePointerCancel}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
            >
              <Image
                {...image.sources}
                alt={image.alt}
                className={styles.image}
                key={image.id}
                loading={'eager'}
                sizes={'(width < 56rem) 100vw, 840px'}
              />

              {hasPaging && (
                <>
                  <button
                    aria-label={'Předchozí obrázek'}
                    className={clsx(styles.arrowButton, styles.previous)}
                    onClick={showPrevious}
                    type={'button'}
                  >
                    <KeyboardArrowLeftIcon />
                  </button>
                  <button
                    aria-label={'Další obrázek'}
                    className={clsx(styles.arrowButton, styles.next)}
                    onClick={showNext}
                    type={'button'}
                  >
                    <KeyboardArrowRightIcon />
                  </button>
                </>
              )}
            </div>

            {image.description && (
              <figcaption className={styles.caption}>
                {image.description}
              </figcaption>
            )}
          </figure>
        </div>
      )}
    </dialog>
  )
}
