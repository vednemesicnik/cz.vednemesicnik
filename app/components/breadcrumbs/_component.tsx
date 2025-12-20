import type { Breadcrumb } from '~/types/breadcrumb'

import styles from './_styles.module.css'
import { BreadcrumbLink } from './components/breadcrumb-link'

type Props = {
  items: Breadcrumb[]
}

/**
 * Breadcrumb navigation component for displaying hierarchical page location.
 *
 * Renders a horizontal breadcrumb trail that shows the user's current location
 * within the site hierarchy. The last breadcrumb represents the current page
 * and is marked with `aria-current="page"` for accessibility. Breadcrumbs are
 * separated by forward slashes.
 *
 * @param props - Component props containing the breadcrumbs array
 * @returns A semantic nav element containing the breadcrumb trail
 *
 * @example
 * ```tsx
 * // In a route component or layout
 * import { useMatches } from "react-router"
 * import { getBreadcrumbs } from "~/utils/breadcrumbs"
 *
 * function MyLayout() {
 *   const matches = useMatches()
 *   const breadcrumbs = getBreadcrumbs(matches)
 *
 *   return <Breadcrumbs items={breadcrumbs} />
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With explicit breadcrumb data
 * <Breadcrumbs
 *   items={[
 *     { label: "Home", path: "/" },
 *     { label: "Administration", path: "/administration" },
 *     { label: "Users", path: "/administration/users" }
 *   ]}
 * />
 * ```
 *
 * @remarks
 * - Automatically identifies the last breadcrumb as the current page
 * - Uses semantic HTML (`<nav>`, `<ul>`, `<li>`) for accessibility
 * - Separates breadcrumbs with forward slashes (except after the last item)
 * - Integrates with React Router for navigation and active state detection
 * - Works with the `getBreadcrumbs()` utility to extract breadcrumbs from route matches
 */
export const Breadcrumbs = ({ items }: Props) => {
  const breadcrumbsCount = items.length

  return (
    <nav className={styles.container}>
      <ul className={styles.list}>
        {items.map((breadcrumb, index) => {
          const isLastItem = breadcrumbsCount === index + 1
          const hasSeparator = !isLastItem

          return (
            <li className={styles.listItem} key={index}>
              <BreadcrumbLink to={breadcrumb.path}>
                {breadcrumb.label}
              </BreadcrumbLink>
              {hasSeparator && <span>/</span>}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
