import styles from "./_styles.module.css"

type Props = {
  alt: string
  src: string
}

export function ArticleLinkImage({ alt, src }: Props) {
  return (
    <img
      alt={alt}
      src={src}
      loading={"lazy"}
      width={"150"}
      height={"100"}
      className={styles.cover}
    />
  )
}
