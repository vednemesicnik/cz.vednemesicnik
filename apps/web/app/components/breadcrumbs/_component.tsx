import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The trail above a record's title (design 23a): where the page sits, from
 * its section down. The current page is the last item, and its link says so
 * with `aria-current="page"`.
 *
 * @example
 * ```tsx
 * <Breadcrumbs>
 *   {breadcrumbs.map((breadcrumb) => (
 *     <BreadcrumbsItem key={breadcrumb.path} to={breadcrumb.path}>
 *       {breadcrumb.label}
 *     </BreadcrumbsItem>
 *   ))}
 * </Breadcrumbs>
 * ```
 *
 * @param props.children - The `BreadcrumbsItem`s, from the section to the page
 * @returns The `<nav>` with the trail as a list
 */
export const Breadcrumbs = ({ children, className }: Props) => {
  return (
    <nav className={clsx(styles.container, className)}>
      <ul className={styles.list}>{children}</ul>
    </nav>
  )
}
