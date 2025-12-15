import { clsx } from "clsx"
import type { ComponentProps } from "react"

import { BaseButton } from "~/components/base-button"

import styles from "./_styles.module.css"

type Variant = "primary" | "secondary" | "danger"

type Props = ComponentProps<"button"> & {
  variant?: Variant
}

export const AdminButton = ({
  children,
  className,
  variant = "primary",
  ...rest
}: Props) => (
  <BaseButton
    className={clsx(
      styles.button,
      variant === "primary" && styles.primary,
      variant === "secondary" && styles.secondary,
      variant === "danger" && styles.danger,
      className
    )}
    {...rest}
  >
    {children}
  </BaseButton>
)
