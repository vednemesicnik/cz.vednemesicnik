import { clsx } from "clsx"
import type { ComponentProps } from "react"

import styles from "./_styles.module.css"

type Props = ComponentProps<"button"> & {
  variant?: "primary" | "danger" | "default"
}

export const Button = ({
  children,
  className,
  variant = "primary",
  ...rest
}: Props) => (
  <button
    className={clsx(
      styles.button,
      variant === "primary" && styles.primary,
      variant === "danger" && styles.danger,
      variant === "default" && styles.default,
      className
    )}
    {...rest}
  >
    {children}
  </button>
)
