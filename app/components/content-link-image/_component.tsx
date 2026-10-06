import { clsx } from 'clsx'
import { Image } from '~/components/image'
import { sizeConfig } from '~/config/size-config'
import type { ImageSources } from '~/utils/image-store/create-image-sources'
import styles from './_styles.module.css'

type Props = {
  alt: string | undefined
  image?: ImageSources
  shape?: 'wide' | 'square'
  className?: string
}

const { width } = sizeConfig.articleLinkImage

/**
 * The row's thumbnail: 192 × 108 beside the text, full width × 160 px when the row
 * stacks below 640 px, under the signature-gradient veil.
 *
 * @param shape - `wide` (default) crops the image to the frame; `square` shows a
 *   square cover (podcast episode) whole on the gradient (design vhn58g3f).
 * @returns The image, or the full signature gradient when there is none (design 10c).
 */
export function ContentLinkImage({
  alt,
  image,
  shape = 'wide',
  className,
}: Props) {
  // `data-content-link-image` lets the row drop its image area when there is no frame.
  if (image?.src === undefined) {
    return (
      <div
        aria-hidden
        className={clsx(styles.frame, styles.fallback, className)}
        data-content-link-image
      />
    )
  }

  const isSquare = shape === 'square'

  return (
    <div
      className={clsx(styles.frame, isSquare && styles.square, className)}
      data-content-link-image
    >
      <Image
        {...image}
        alt={alt}
        className={isSquare ? styles.squareImage : styles.wideImage}
        sizes={
          isSquare
            ? '(width < 640px) 160px, 108px'
            : `(width < 640px) 100vw, ${width}px`
        }
      />
    </div>
  )
}
