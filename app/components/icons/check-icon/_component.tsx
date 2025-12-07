import { clsx } from "clsx"
import type { ComponentProps } from "react"

import styles from "./_styles.module.css"

type Props = Pick<ComponentProps<"svg">, "className">

export const CheckIcon = ({ className }: Props) => {
  return (
    <svg
      xmlns={"http://www.w3.org/2000/svg"}
      viewBox={"0 -960 960 960"}
      className={clsx(styles.icon, className)}
    >
      <path
        d={
          "M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"
        }
      />
    </svg>
  )
}