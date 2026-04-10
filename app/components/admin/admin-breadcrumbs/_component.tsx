import { Activity } from 'react'

import { BaseBreadcrumbLink } from '~/components/base-breadcrumb-link'
import type { Breadcrumb } from '~/types/breadcrumb'

import styles from './_styles.module.css'

type Props = {
  items: Breadcrumb[]
}

/**
 * Admin breadcrumb navigation component for displaying hierarchical page location.
 *
 * Renders a horizontal breadcrumb trail styled for the administration interface
 * using admin design tokens. The last breadcrumb represents the current page
 * and is marked with `aria-current="page"` for accessibility.
 *
 * @param props - Component props containing the breadcrumbs array
 * @returns A semantic nav element containing the breadcrumb trail with admin styling
 *
 * @example
 * ```tsx
 * // In an admin route component or layout
 * import { useMatches } from "react-router"
 * import { getBreadcrumbs } from "~/utils/breadcrumbs"
 *
 * function AdminLayout() {
 *   const matches = useMatches()
 *   const breadcrumbs = getBreadcrumbs(matches)
 *
 *   return <AdminBreadcrumbs items={breadcrumbs} />
 * }
 * ```
 *
 * @remarks
 * - Uses admin design tokens for consistent styling with the admin interface
 * - Automatically identifies the last breadcrumb as the current page
 * - Uses semantic HTML (`<nav>`, `<ul>`, `<li>`) for accessibility
 * - Separates breadcrumbs with forward slashes (except after the last item)
 * - Integrates with React Router for navigation and active state detection
 */
export const AdminBreadcrumbs = ({ items }: Props) => {
  const breadcrumbsCount = items.length

  return (
    <nav className={styles.container}>
      <ul className={styles.list}>
        {items.map((breadcrumb, index) => {
          const isLastItem = breadcrumbsCount === index + 1

          return (
            <li className={styles.listItem} key={index}>
              <BaseBreadcrumbLink className={styles.link} to={breadcrumb.path}>
                {breadcrumb.label}
              </BaseBreadcrumbLink>
              <Activity mode={isLastItem ? 'hidden' : 'visible'}>
                <span className={styles.separator}>/</span>
              </Activity>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
