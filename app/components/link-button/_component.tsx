import { combineClasses } from "@liborgabrhel/style-utils"
import type { ComponentProps } from "react"
import { Link } from "react-router"

import styles from "./_styles.module.css"

type Props = ComponentProps<typeof Link>

export const LinkButton = ({ children, className, ...rest }: Props) => (
  <Link className={combineClasses(styles.link_button, className)} {...rest}>
    {children}
  </Link>
)
