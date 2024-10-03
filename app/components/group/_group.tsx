import { type ReactNode } from "react"

import styles from "./_group.module.css"

type Props = {
  label: string
  children: ReactNode
}

export const Group = ({ label, children }: Props) => {
  return (
    <section className={styles.container}>
      <h2 className={styles.label}>{label}</h2>
      {children}
    </section>
  )
}
