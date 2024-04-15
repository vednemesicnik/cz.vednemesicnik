import type { ReactNode } from "react"
import styles from "./_podcast-episode-list.module.css"

type Props = {
  children: ReactNode
}

export function PodcastEpisodeList({ children }: Props) {
  return (
    <section className={styles.container}>
      <h3>Všechny epizody:</h3>
      <ul>{children}</ul>
    </section>
  )
}
