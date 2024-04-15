import { combineStyles } from "~/utils/combine-styles"
import styles from "./_button.module.css"
import type { ComponentProps } from "react"
import { applyStyles } from "~/utils/apply-styles"

type Props = ComponentProps<"button"> & {
  variant?: "primary" | "danger"
}
export const Button = ({ children, className, variant = "primary", ...rest }: Props) => (
  <button
    className={combineStyles(
      styles.button,
      applyStyles(styles.primary).if(variant === "primary"),
      applyStyles(styles.danger).if(variant === "danger"),
      className
    )}
    {...rest}
  >
    {children}
  </button>
)
