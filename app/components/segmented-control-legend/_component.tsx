import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The visible name of a `SegmentedControl`'s choice, and the group's
 * accessible name.
 *
 * @param props.children - The name, e.g. „Režim“
 * @returns The `<legend>`
 */
export const SegmentedControlLegend = ({ children, className }: Props) => {
  return <legend className={clsx(styles.legend, className)}>{children}</legend>
}
