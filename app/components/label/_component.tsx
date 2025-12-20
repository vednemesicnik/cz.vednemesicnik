import { clsx } from "clsx"
import { Activity, type ComponentProps } from "react"

import styles from "./_styles.module.css"

type Props = ComponentProps<"label"> & {
  required?: boolean
}

export const Label = ({ children, className, required, ...rest }: Props) => {
  return (
    <label className={clsx(styles.label, className)} {...rest}>
      {children} <Activity mode={required ? "visible" : "hidden"}>*</Activity>
    </label>
  )
}
