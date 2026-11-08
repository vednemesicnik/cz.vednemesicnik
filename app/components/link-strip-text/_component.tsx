import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The sentence of `LinkStrip`, e.g. "Články mají i štítky, třeba" (11c).
 *
 * @returns The sentence
 */
export const LinkStripText = ({ children, className }: Props) => {
  return <span className={clsx(styles.text, className)}>{children}</span>
}
