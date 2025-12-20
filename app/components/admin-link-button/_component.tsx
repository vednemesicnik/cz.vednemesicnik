import { clsx } from "clsx"
import type { ComponentProps, MouseEvent } from "react"

import { BaseLink } from "~/components/base-link"

import styles from "./_styles.module.css"

type Props = ComponentProps<typeof BaseLink> & {
  disabled?: boolean
}

export const AdminLinkButton = ({
  children,
  className,
  disabled,
  onClick,
  ...rest
}: Props) => {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (disabled) {
      event.preventDefault()
      return
    }
    onClick?.(event)
  }

  return (
    <BaseLink
      className={clsx(styles.linkButton, className)}
      aria-disabled={disabled}
      onClick={handleClick}
      {...rest}
    >
      {children}
    </BaseLink>
  )
}
