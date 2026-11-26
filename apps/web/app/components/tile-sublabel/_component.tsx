import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The smaller second line of a tile's caption, e.g. the issue's order „3/2026“
 * (design 14a).
 *
 * @returns The sublabel
 */
export const TileSublabel = ({ children, className }: Props) => {
  return <span className={clsx(styles.sublabel, className)}>{children}</span>
}
