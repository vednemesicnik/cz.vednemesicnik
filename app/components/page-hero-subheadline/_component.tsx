import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The line under a PageHero's headline: the Subheadline's size, white and medium
 * weight. Its own element, because Subheadline's styles sit outside any layer
 * and no layered restyle can win over them.
 */
export const PageHeroSubheadline = ({ children, className }: Props) => {
  return <p className={clsx(styles.subheadline, className)}>{children}</p>
}
