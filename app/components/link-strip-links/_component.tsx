import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The example links of `LinkStrip`, after its sentence (11c). Leave it out
 * when there are none.
 *
 * @param children - The `LinkStripLink`s
 * @returns The links
 */
export const LinkStripLinks = ({ children, className }: Props) => {
  return <span className={clsx(styles.links, className)}>{children}</span>
}
