import { clsx } from 'clsx'

import { Image } from '~/components/image'
import type { ImageSources } from '~/utils/image-store/create-image-sources'

import styles from './_styles.module.css'

type Props = {
  /** Full name; its initials stand in when there is no image. */
  name: string
  image: ImageSources
  /** The diameter in pixels: 24 in a suggestion, 28 in a row (24j). */
  size: number
  className?: string
}

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('')

/**
 * The design system's `Avatar` (components/brand/Avatar): a round photo, or the
 * initials on the signature gradient. It stands beside the visible name, so
 * readers skip it.
 *
 * @param props.name - The person's name, for the initials.
 * @param props.image - The photo's sources; without `src` the initials show.
 * @param props.size - The diameter in pixels.
 */
export const Avatar = ({ name, image, size, className }: Props) => (
  <span
    aria-hidden
    className={clsx(styles.avatar, className)}
    style={{ blockSize: size, fontSize: size * 0.4, inlineSize: size }}
  >
    {image.src === undefined ? (
      getInitials(name)
    ) : (
      <Image {...image} alt={''} className={styles.image} sizes={`${size}px`} />
    )}
  </span>
)
