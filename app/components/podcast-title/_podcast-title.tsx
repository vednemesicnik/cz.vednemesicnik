import type { ReactNode } from "react"
import styles from "./_podcast-title.module.css"

type Props = {
  children: ReactNode
}

export function PodcastTitle({ children }: Props) {
  return <h2 className={styles.title}>{children}</h2>
}
