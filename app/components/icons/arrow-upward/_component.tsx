import { clsx } from "clsx"
import type { ComponentProps } from "react"

import styles from "./_styles.module.css"

type Props = Pick<ComponentProps<"svg">, "className">

export const ArrowUpward = ({ className }: Props) => {
  return (
    <svg
      xmlns={"http://www.w3.org/2000/svg"}
      viewBox={"0 -960 960 960"}
      className={clsx(styles.icon, className)}
    >
      <path
        d={
          "M440-160v-487L216-423l-56-57 320-320 320 320-56 57-224-224v487h-80Z"
        }
      />
    </svg>
  )
}
