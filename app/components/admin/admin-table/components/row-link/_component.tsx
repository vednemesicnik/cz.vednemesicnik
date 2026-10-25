import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { BaseLink } from '~/components/base-link'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  to: string
  className?: string
}

/**
 * The row's name as the link to its detail — Zobrazit is gone (22a). Below
 * 768 px it covers the folded row, so a tap anywhere on it opens the detail
 * (design 32, 22g); „⋯“ stays above it.
 */
export const TableRowLink = ({ children, to, className }: Props) => (
  <BaseLink className={clsx(styles.link, className)} to={to}>
    {children}
  </BaseLink>
)
