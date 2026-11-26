import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * A line under a `Checkbox`'s sentence, e.g. what ticking it does. It is part of the
 * checkbox's label, so it is read with its name.
 *
 * @param props.children - The line
 * @returns The hint's `<span>`
 */
export const CheckboxHint = ({ children, className }: Props) => (
  <span className={clsx(styles.hint, className)}>{children}</span>
)
