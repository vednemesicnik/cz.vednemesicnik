import { applyClasses, combineClasses } from "@liborgabrhel/style-utils"
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
    className={combineClasses(
      styles.button,
      applyClasses(styles.primary).if(variant === "primary"),
      applyClasses(styles.danger).if(variant === "danger"),
      applyClasses(styles.default).if(variant === "default"),
      className
    )}
    {...rest}
  >
    {children}
  </button>
)
