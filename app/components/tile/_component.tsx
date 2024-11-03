import { Image } from "~/components/image"

import styles from "./_styles.module.css"

type Props = {
  label: string
  src: string
  alt: string
  width: number
  height: number
  placeholderWidth: number
  placeholderHeight: number
}

export const Tile = ({
  label,
  src,
  alt,
  width,
  height,
  placeholderWidth,
  placeholderHeight,
}: Props) => {
  return (
    <figure className={styles.container}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        placeholderWidth={placeholderWidth}
        placeholderHeight={placeholderHeight}
      />
      <figcaption className={styles.label}>{label}</figcaption>
    </figure>
  )
}
