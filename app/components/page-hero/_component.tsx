import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

export const PageHero = ({ children }: Props) => {
  return (
    <section className={styles.pageHero} data-page-hero>
      {children}
    </section>
  )
}
