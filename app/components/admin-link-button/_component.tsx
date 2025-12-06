import { clsx } from "clsx"
import type { ComponentProps } from "react"

import { BaseLink } from "~/components/base-link"

import styles from "./_styles.module.css"

type Props = ComponentProps<typeof BaseLink>

export const AdminLinkButton = ({ children, className, ...rest }: Props) => (
  <BaseLink className={clsx(styles.linkButton, className)} {...rest}>
    {children}
  </BaseLink>
)