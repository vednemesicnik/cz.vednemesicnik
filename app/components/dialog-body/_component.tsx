import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  /** The body's paragraphs (`AdminModalDescription`). */
  children: ReactNode
  className?: string
}

/**
 * The design system's dialog body (`.vdm-dialog__body`): the paragraphs of one
 * message, 12 px apart, closer to each other than to the title and the actions
 * (`Dialog`, 0zgyl1ao; in5bl1cq).
 */
export const DialogBody = ({ children, className }: Props) => (
  <div className={clsx(styles.dialogBody, className)}>{children}</div>
)
