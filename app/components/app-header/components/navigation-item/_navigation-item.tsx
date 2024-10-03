import { applyClasses, combineClasses } from "@liborgabrhel/style-utils"
import { NavLink } from "@remix-run/react"
import type { ReactNode } from "react"

import styles from "./_navigation-item.module.css"

type Props = {
  children: ReactNode
  to: string
}

export const NavigationItem = ({ children, to }: Props) => (
  <li className={styles.container}>
    <NavLink
      to={to}
      className={({ isActive }) => {
        console.log(isActive)
        console.log(
          combineClasses(styles.link, applyClasses(styles.active).if(isActive))
        )
        return combineClasses(
          styles.link,
          applyClasses(styles.active).if(isActive)
        )
      }}
    >
      {children}
    </NavLink>
  </li>
)
