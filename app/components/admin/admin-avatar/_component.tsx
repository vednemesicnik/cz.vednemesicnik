import { clsx } from 'clsx'

import { Image } from '~/components/image'
import type { ImageSources } from '~/utils/image-store/create-image-sources'

import styles from './_styles.module.css'

type Size = 'extra-small' | 'small' | 'medium' | 'large'

type Props = {
  image: ImageSources
  alt: string
  // Full name; its initials stand in when there is no image.
  name?: string
  size?: Size
  className?: string
}

const sizeMap: Record<Size, number> = {
  'extra-small': 32,
  large: 128,
  medium: 96,
  small: 64,
}

const sizeClassNames: Record<Size, string | undefined> = {
  'extra-small': styles.extraSmall,
  large: styles.large,
  medium: styles.medium,
  small: styles.small,
}

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('')

export const AdminAvatar = ({
  image,
  alt,
  name,
  size = 'medium',
  className,
}: Props) => {
  const hasImage = image.src !== undefined

  return (
    <div
      className={clsx(
        styles.avatar,
        sizeClassNames[size],
        !hasImage && name && styles.initials,
        className,
      )}
    >
      {hasImage || !name ? (
        <Image
          {...image}
          alt={alt}
          className={styles.image}
          sizes={`${sizeMap[size]}px`}
        />
      ) : (
        <span aria-hidden>{getInitials(name)}</span>
      )}
    </div>
  )
}
