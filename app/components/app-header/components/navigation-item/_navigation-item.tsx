import type { ReactNode } from "react"
import { NavLink } from "@remix-run/react"
import styles from "./_navigation-item.module.css"
import { applyClasses, combineClasses } from "@liborgabrhel/style-utils"

type Props = {
  children: ReactNode
  to: string
}

export const NavigationItem = ({ children, to }: Props) => (
  <li className={styles.container}>
    <NavLink
      to={to}
      className={({ isActive }) => combineClasses(styles.link, applyClasses(styles.active).if(isActive))}
    >
      {children}
    </NavLink>
  </li>
)
