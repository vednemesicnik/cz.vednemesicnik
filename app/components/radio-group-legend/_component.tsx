import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The name of a `RadioGroup`'s choice, set like a field's label, and the
 * group's accessible name. It goes first in the group.
 *
 * @param props.children - The name, e.g. „Role“
 * @returns The `<legend>`
 */
export const RadioGroupLegend = ({ children, className }: Props) => (
  <legend className={clsx(styles.legend, className)}>{children}</legend>
)
