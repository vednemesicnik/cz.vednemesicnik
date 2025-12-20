import { clsx } from 'clsx'

import { Image } from '~/components/image'

import styles from './_styles.module.css'

type Size = 'small' | 'medium' | 'large'

type Props = {
  src: string
  alt: string
  size?: Size
  className?: string
}

const sizeMap: Record<Size, { width: number; height: number }> = {
  large: { height: 128, width: 128 },
  medium: { height: 96, width: 96 },
  small: { height: 64, width: 64 },
}

export const AdminAvatar = ({
  src,
  alt,
  size = 'medium',
  className,
}: Props) => {
  const dimensions = sizeMap[size]

  return (
    <div className={clsx(styles.avatar, styles[size], className)}>
      <Image
        alt={alt}
        className={styles.image}
        height={dimensions.height}
        src={src}
        width={dimensions.width}
      />
    </div>
  )
}
