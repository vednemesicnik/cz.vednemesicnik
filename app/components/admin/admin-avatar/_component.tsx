import { clsx } from 'clsx'

import { Image } from '~/components/image'
import type { ImageSources } from '~/utils/image-store/create-image-sources'

import styles from './_styles.module.css'

type Size = 'small' | 'medium' | 'large'

type Props = {
  image: ImageSources
  alt: string
  size?: Size
  className?: string
}

const sizeMap: Record<Size, number> = {
  large: 128,
  medium: 96,
  small: 64,
}

export const AdminAvatar = ({
  image,
  alt,
  size = 'medium',
  className,
}: Props) => {
  return (
    <div className={clsx(styles.avatar, styles[size], className)}>
      <Image
        {...image}
        alt={alt}
        className={styles.image}
        sizes={`${sizeMap[size]}px`}
      />
    </div>
  )
}
