import type { ReactNode } from "react"
import styles from "./_podcast-subtitle.module.css"

type Props = {
  children: ReactNode
}

export function PodcastSubtitle({ children }: Props) {
  return <p className={styles.subtitle}>{children}</p>
}
