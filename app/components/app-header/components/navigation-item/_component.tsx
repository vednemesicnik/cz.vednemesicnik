import { applyClasses, combineClasses } from "@liborgabrhel/style-utils"
import { NavLink } from "@remix-run/react"
import type { ReactNode } from "react"

import styles from "./_styles.module.css"

type Props = {
  children: ReactNode
  to: string
}

export const NavigationItem = ({ children, to }: Props) => (
  <li className={styles.container}>
    <NavLink
      prefetch={"intent"}
      to={to}
      className={({ isActive }) =>
        combineClasses(styles.link, applyClasses(styles.active).if(isActive))
      }
    >
      {children}
    </NavLink>
  </li>
)
