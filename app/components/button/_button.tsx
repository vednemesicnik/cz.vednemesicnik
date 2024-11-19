import { applyClasses, combineClasses } from "@liborgabrhel/style-utils"
import type { ComponentProps } from "react"

import styles from "./_button.module.css"

type Props = ComponentProps<"button"> & {
  variant?: "primary" | "danger"
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
      className
    )}
    {...rest}
  >
    {children}
  </button>
)
