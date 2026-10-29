import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The card's content when there is no cover: the signature gradient with the
 * name in white (design 14c, like a missing article image in 10c). Decorative —
 * the caption under the card says the same.
 *
 * @param children - The name, e.g. „červen 2026“
 * @returns The fallback panel
 */
export const TileFallback = ({ children, className }: Props) => {
  return (
    <div aria-hidden={true} className={clsx(styles.fallback, className)}>
      <span className={styles.text}>{children}</span>
    </div>
  )
}
