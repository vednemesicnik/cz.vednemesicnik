import { clsx } from "clsx"
import type { ComponentProps } from "react"
import { NavLink } from "react-router"

import styles from "./_styles.module.css"

type Props = {
  isCurrentPage: boolean
} & ComponentProps<typeof NavLink>

/**
 * A specialized navigation link component for breadcrumb trails.
 *
 * Wraps React Router's NavLink with breadcrumb-specific styling and accessibility
 * features. Automatically applies visual styling for active/current pages and sets
 * appropriate ARIA attributes for screen readers.
 *
 * @param props - Component props including NavLink properties and isCurrentPage flag
 * @returns A styled navigation link with breadcrumb accessibility features
 *
 * @example
 * ```tsx
 * // In a breadcrumb navigation
 * <BreadcrumbLink to="/admin" isCurrentPage={false}>
 *   Administration
 * </BreadcrumbLink>
 *
 * // Current page (last breadcrumb)
 * <BreadcrumbLink to="/admin/users" isCurrentPage={true}>
 *   Users
 * </BreadcrumbLink>
 * ```
 *
 * @remarks
 * - Sets `aria-current="page"` when `isCurrentPage` is true for accessibility
 * - Uses `end={true}` for exact route matching
 * - Enables intent-based prefetching for improved navigation performance
 * - Supports view transitions for smooth page changes
 * - Applies active styling via the `isActive` state from NavLink
 */
export const BreadcrumbLink = ({
  children,
  to,
  isCurrentPage,
  ...rest
}: Props) => {
  return (
    <NavLink
      aria-current={isCurrentPage ? "page" : undefined}
      className={({ isActive }) => clsx(styles.link, isActive && styles.active)}
      end={true}
      prefetch={"intent"}
      to={to}
      viewTransition={true}
      {...rest}
    >
      {children}
    </NavLink>
  )
}
