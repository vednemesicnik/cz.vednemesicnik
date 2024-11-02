import { Image } from "~/components/image"

import styles from "./_styles.module.css"

type Props = {
  label: string
  src: string
  alt: string
  width: number
  height: number
}

export const Tile = ({ label, src, alt, width, height }: Props) => {
  return (
    <figure className={styles.container}>
      <Image src={src} alt={alt} width={width} height={height} />
      <figcaption className={styles.label}>{label}</figcaption>
    </figure>
  )
}
