import { clsx } from 'clsx'
import type { ComponentProps } from 'react'
import { BaseLink } from '~/components/base-link'
import styles from './_styles.module.css'

type Props = ComponentProps<typeof BaseLink> & {
  variant?: 'filled' | 'outlined'
}

/**
 * A small tag-shaped link used for article categories ("rubriky") and tags
 * ("štítky"). Renders a {@link BaseLink}, so it navigates with prefetch and a
 * view transition like the rest of the public site.
 *
 * @param variant - `filled` (default, for categories) or `outlined` (for tags)
 * @returns A styled navigation badge
 */
export const Badge = ({
  children,
  className,
  variant = 'filled',
  ...rest
}: Props) => {
  return (
    <BaseLink
      className={clsx(styles.badge, styles[variant], className)}
      {...rest}
    >
      {children}
    </BaseLink>
  )
}
