import type { ReactNode } from "react"

import { ArrowDropDownIcon } from "~/components/icons/arrow-drop-down-icon"

import styles from "./_styles.module.css"

type Props = {
  children: ReactNode
  isOpen: boolean
  onClick: () => void
}

export const Toggle = ({ children, isOpen, onClick }: Props) => {
  return (
    <button
      type="button"
      className={styles.trigger}
      onClick={onClick}
      aria-expanded={isOpen}
      aria-haspopup="true"
    >
      <span className={styles.userName}>{children}</span>
      <ArrowDropDownIcon className={styles.icon} />
    </button>
  )
}
