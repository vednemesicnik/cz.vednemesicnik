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
      <img
        src={src}
        alt={alt}
        loading={"lazy"}
        width={width}
        height={height}
        className={styles.image}
      />
      <figcaption className={styles.label}>{label}</figcaption>
    </figure>
  )
}
