import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * A dialog's sentence in full ink (22c, 23f, 26f), where the secondary ink of
 * `AdminModalDescription` would hide it: Smazání je nevratné. where a list says
 * so, and the records a publish waits on or skips.
 *
 * @param props.children - The sentence
 * @returns The paragraph
 */
export const AdminModalNote = ({ children, className }: Props) => {
  return <p className={clsx(styles.note, className)}>{children}</p>
}
