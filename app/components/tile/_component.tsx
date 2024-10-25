import { Link } from "@remix-run/react"
import type { ReactNode } from "react"

import styles from "./_styles.module.css"

type Props = {
  children: ReactNode
  to: string
}

export function Tile({ children, to }: Props) {
  return (
    <li>
      <Link to={to}>
        <section className={styles.container}>{children}</section>
      </Link>
    </li>
  )
}
