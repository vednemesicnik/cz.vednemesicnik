import { combineClasses } from "@liborgabrhel/style-utils"
import { type ComponentProps } from "react"

import styles from "./_styles.module.css"

type Props = ComponentProps<"label"> & {
  children: string
  required?: boolean
}

export const Label = ({ children, className, required, ...rest }: Props) => {
  return (
    <label className={combineClasses(styles.label, className)} {...rest}>
      {children} {required && "*"}
    </label>
  )
}
