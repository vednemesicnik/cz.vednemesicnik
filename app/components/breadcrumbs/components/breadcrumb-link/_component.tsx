import { clsx } from 'clsx'
import type { ComponentProps } from 'react'

import { BaseBreadcrumbLink } from '~/components/base-breadcrumb-link'

import styles from './_styles.module.css'

type Props = ComponentProps<typeof BaseBreadcrumbLink>

/**
 * A specialized navigation link component for breadcrumb trails.
 *
 * Wraps BaseBreadcrumbLink with public website styling. Automatically applies
 * visual styling for active/current pages and sets appropriate ARIA attributes
 * for screen readers.
 *
 * @param props - Component props including NavLink properties
 * @returns A styled navigation link with breadcrumb accessibility features
 *
 * @example
 * ```tsx
 * // In a breadcrumb navigation
 * <BreadcrumbLink to="/articles">
 *   Articles
 * </BreadcrumbLink>
 *
 * // Current page (automatically detected via useMatch)
 * <BreadcrumbLink to="/articles/my-post">
 *   My Post
 * </BreadcrumbLink>
 * ```
 *
 * @remarks
 * - Automatically detects current page via useMatch hook
 * - Sets `aria-current="page"` for the current route
 * - Uses `end={true}` for exact route matching
 * - Enables intent-based prefetching for improved navigation performance
 * - Supports view transitions for smooth page changes
 */
export const BreadcrumbLink = ({ className, ...rest }: Props) => {
  return (
    <BaseBreadcrumbLink
      className={(props) =>
        clsx(
          styles.link,
          props.isActive && styles.active,
          typeof className === 'function' ? className(props) : className,
        )
      }
      {...rest}
    />
  )
}
