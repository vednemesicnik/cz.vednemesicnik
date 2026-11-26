import { clsx } from 'clsx'
import type { ComponentProps, ReactNode } from 'react'
import { BaseLink } from '~/components/base-link'
import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
  isPreview?: boolean
  to?: ComponentProps<typeof BaseLink>['to']
  variant?: 'filled' | 'outlined'
}

/**
 * A small pill for article categories ("rubriky") and tags ("štítky").
 *
 * Renders a {@link BaseLink} when `to` is provided (e.g. on the article detail,
 * navigating with prefetch + view transition), or a plain `span` when it is
 * omitted — used on listing cards, where the whole card is already a link and a
 * nested anchor would be invalid.
 *
 * @param isPreview - A category or tag the reader doesn't see: a dashed line
 *   in place of its edge (10d, 11e)
 * @param variant - `filled` (default, for categories) or `outlined` (for tags)
 * @returns A styled badge link or label
 */
export const Badge = ({
  children,
  className,
  isPreview = false,
  to,
  variant = 'filled',
}: Props) => {
  const badgeClassName = clsx(
    styles.badge,
    styles[variant],
    isPreview && styles.preview,
    className,
  )

  if (to === undefined) {
    return <span className={badgeClassName}>{children}</span>
  }

  return (
    <BaseLink className={badgeClassName} to={to}>
      {children}
    </BaseLink>
  )
}
