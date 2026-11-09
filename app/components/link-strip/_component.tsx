import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * A tinted strip leading from one index to another, below its list (design
 * 11c): a short sentence, optional example links and a trailing "… →" link.
 *
 * @param children - A `LinkStripText`, optionally `LinkStripLinks` with the
 *   examples, then a `LinkStripMore` to the other index
 * @returns The strip
 */
export const LinkStrip = ({ children, className }: Props) => {
  return <aside className={clsx(styles.strip, className)}>{children}</aside>
}
