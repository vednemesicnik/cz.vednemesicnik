import type { ReactNode } from 'react'

import { ArrowDropDownIcon } from '~/components/icons/arrow-drop-down-icon'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  isOpen: boolean
  onClick: () => void
}

export const Toggle = ({ children, isOpen, onClick }: Props) => {
  return (
    <button
      aria-expanded={isOpen}
      aria-haspopup="true"
      className={styles.trigger}
      onClick={onClick}
      type="button"
    >
      <span className={styles.userName}>{children}</span>
      <ArrowDropDownIcon className={styles.icon} />
    </button>
  )
}
