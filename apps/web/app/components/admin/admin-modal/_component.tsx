import type { ComponentPropsWithoutRef, ReactNode, RefObject } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  ref: RefObject<HTMLDialogElement | null>
} & ComponentPropsWithoutRef<'dialog'>

export const AdminDialog = ({ children, ref, ...dialogProps }: Props) => (
  <dialog className={styles.dialog} ref={ref} {...dialogProps}>
    {children}
  </dialog>
)
