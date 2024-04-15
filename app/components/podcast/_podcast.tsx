import type { ReactNode } from "react"
import styles from "./_podcast.module.css"

type Props = {
  children: ReactNode
}

export function Podcast({ children }: Props) {
  return <section className={styles.container}>{children}</section>
}
