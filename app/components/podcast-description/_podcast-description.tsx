import type { ReactNode } from 'react'

import styles from './_podcast-description.module.css'

type Props = {
  children: ReactNode
}

export function PodcastDescription({ children }: Props) {
  return <p className={styles.paragraph}>{children}</p>
}
