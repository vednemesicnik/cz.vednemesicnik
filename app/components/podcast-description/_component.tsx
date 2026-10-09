import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

export function PodcastDescription({ children }: Props) {
  return <p className={styles.paragraph}>{children}</p>
}
