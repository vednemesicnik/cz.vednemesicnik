import styles from "./_styles.module.css"

type Props = {
  src: string
  alt: string
}

export const TileImage = ({ src, alt }: Props) => {
  return (
    <img
      src={src}
      alt={alt}
      loading={"lazy"}
      width={"217"}
      height={"217"}
      className={styles.image}
    />
  )
}
