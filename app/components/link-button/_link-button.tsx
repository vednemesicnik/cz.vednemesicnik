import { combineClasses } from "@liborgabrhel/style-utils"
import { Link } from "@remix-run/react"
import type { ComponentProps } from "react"

import styles from "./_link-button.module.css"

type Props = ComponentProps<typeof Link>

export const LinkButton = ({ children, className, ...rest }: Props) => (
  <Link className={combineClasses(styles.link_button, className)} {...rest}>
    {children}
  </Link>
)
