import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { BaseBreadcrumbLink } from '~/components/base-breadcrumb-link'
import { useReturnLink } from '~/hooks/use-return-link'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  to: string
  className?: string
}

/**
 * One step of `Breadcrumbs`, a link with a slash after it; the last one, the
 * current page, has none. A step to a list the record was opened from in this
 * tab leads back to that list as it was left, its search, filters, sort and
 * page (design 30i, n3wa2ld4).
 *
 * @param props.children - The step's label, e.g. „Články“
 * @param props.to - The step's page
 * @returns The list item with its link
 */
export const BreadcrumbsItem = ({ children, to, className }: Props) => {
  const { href, state } = useReturnLink(to)

  return (
    <li className={clsx(styles.item, className)}>
      <BaseBreadcrumbLink className={styles.link} state={state} to={href}>
        {children}
      </BaseBreadcrumbLink>
      <span className={styles.separator}>/</span>
    </li>
  )
}
