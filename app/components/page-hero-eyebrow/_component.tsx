import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/** The short line above a PageHero's headline, in white capitals. */
export const PageHeroEyebrow = ({ children, className }: Props) => {
  return <p className={clsx(styles.eyebrow, className)}>{children}</p>
}
