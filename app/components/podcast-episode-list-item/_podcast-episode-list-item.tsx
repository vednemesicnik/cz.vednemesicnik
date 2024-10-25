import type { ReactNode } from "react"

import styles from "./_podcast-episode-list-item.module.css"

type Props = {
  children: ReactNode
}

export function PodcastEpisodeListItem({ children }: Props) {
  return <article className={styles.detail}>{children}</article>
}
