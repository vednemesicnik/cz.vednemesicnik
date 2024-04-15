import type { ReactNode } from "react"
import { NavLink } from "@remix-run/react"
import styles from "./_navigation-item.module.css"
import { combineStyles } from "~/utils/combine-styles"
import { applyStyles } from "~/utils/apply-styles"

type Props = {
  children: ReactNode
  to: string
}

export const NavigationItem = ({ children, to }: Props) => (
  <li className={styles.container}>
    <NavLink to={to} className={({ isActive }) => combineStyles(styles.link, applyStyles(styles.active).if(isActive))}>
      {children}
    </NavLink>
  </li>
)
