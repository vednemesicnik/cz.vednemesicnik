import { applyClasses, combineClasses } from "@liborgabrhel/style-utils"

import styles from "./_styles.module.css"

type Props = {
  variant?: "primary" | "secondary"
}

export const Divider = ({ variant = "primary" }: Props) => {
  return (
    <hr
      className={combineClasses(
        styles.divider,
        applyClasses(styles.primary).if(variant === "primary"),
        applyClasses(styles.secondary).if(variant === "secondary")
      )}
    />
  )
}
