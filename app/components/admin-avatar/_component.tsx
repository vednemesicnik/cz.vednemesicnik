import { clsx } from "clsx"

import { Image } from "~/components/image"

import styles from "./_styles.module.css"

type Size = "small" | "medium" | "large"

type Props = {
  src: string
  alt: string
  size?: Size
  className?: string
}

const sizeMap: Record<Size, { width: number; height: number }> = {
  small: { width: 64, height: 64 },
  medium: { width: 96, height: 96 },
  large: { width: 128, height: 128 },
}

export const AdminAvatar = ({
  src,
  alt,
  size = "medium",
  className,
}: Props) => {
  const dimensions = sizeMap[size]

  return (
    <div className={clsx(styles.avatar, styles[size], className)}>
      <Image
        src={src}
        alt={alt}
        width={dimensions.width}
        height={dimensions.height}
        className={styles.image}
      />
    </div>
  )
}
