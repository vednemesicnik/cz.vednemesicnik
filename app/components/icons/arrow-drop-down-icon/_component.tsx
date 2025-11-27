import { clsx } from "clsx"
import type { ComponentProps } from "react"

import styles from "./_styles.module.css"

type Props = Pick<ComponentProps<"svg">, "className">

export const ArrowDropDownIcon = ({ className }: Props) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 -960 960 960"
      className={clsx(styles.icon, className)}
    >
      <path d="M480-360 280-560h400L480-360Z" />
    </svg>
  )
}