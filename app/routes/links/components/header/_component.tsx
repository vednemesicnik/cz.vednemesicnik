import type { ReactNode } from "react"

import styles from "./_styles.module.css"

type Props = {
  logo: ReactNode
  children: ReactNode
}

export const Header = ({ logo, children }: Props) => {
  return (
    <header className={styles.container}>
      <div className={styles.blockDivider} />
      <section className={styles.logo}>
        <div className={styles.logoDivider} />
        {logo}
        <div className={styles.logoDivider} />
      </section>
      <section className={styles.content}>{children}</section>
    </header>
  )
}
