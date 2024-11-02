import { type ReactNode } from "react"

import styles from "./_styles.module.css"

type Props = {
  children: ReactNode
  title: string
}

export const FeaturedBanner = ({ children, title }: Props) => {
  return (
    <section className={styles.container}>
      <h2 className={styles.title}>{title}</h2>
      {children}
    </section>
  )
}
