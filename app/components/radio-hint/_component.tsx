import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * A line under a `Radio`'s sentence, e.g. what the choice allows. It is part of the
 * radio's label, so it is read with its name.
 *
 * @param props.children - The line
 * @returns The hint's `<span>`
 */
export const RadioHint = ({ children, className }: Props) => (
  <span className={clsx(styles.hint, className)}>{children}</span>
)
