import styles from "./_podcast-cover.module.css"

type Props = {
  alt: string
  src: string
}

export function PodcastCover({ alt, src }: Props) {
  return <img alt={alt} src={src} loading={"lazy"} width={"220"} height={"220"} className={styles.cover} />
}
