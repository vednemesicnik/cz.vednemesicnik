import type { ComponentProps } from "react"
import { Link } from "@remix-run/react"
import { combineStyles } from "~/utils/combine-styles"
import styles from "./_link-button.module.css"

type Props = ComponentProps<typeof Link>

export const LinkButton = ({ children, className, ...rest }: Props) => (
  <Link className={combineStyles(styles.link_button, className)} {...rest}>
    {children}
  </Link>
)
