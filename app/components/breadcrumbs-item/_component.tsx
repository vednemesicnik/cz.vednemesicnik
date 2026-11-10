import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { BaseBreadcrumbLink } from '~/components/base-breadcrumb-link'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  to: string
  className?: string
}

/**
 * One step of `Breadcrumbs`, a link with a slash after it; the last one, the
 * current page, has none.
 *
 * @param props.children - The step's label, e.g. „Články“
 * @param props.to - The step's page
 * @returns The list item with its link
 */
export const BreadcrumbsItem = ({ children, to, className }: Props) => {
  return (
    <li className={clsx(styles.item, className)}>
      <BaseBreadcrumbLink className={styles.link} to={to}>
        {children}
      </BaseBreadcrumbLink>
      <span className={styles.separator}>/</span>
    </li>
  )
}
