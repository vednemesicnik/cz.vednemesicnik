import { clsx } from 'clsx'
import type { ComponentProps, ReactNode } from 'react'
import { Link } from '~/components/link'
import { LinkArrow } from '~/components/link-arrow'
import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
  to: ComponentProps<typeof Link>['to']
}

/**
 * Where to go instead of the empty list in `EmptyState`, e.g.
 * "Všechny články →" (11c). Its arrow is hidden from screen readers.
 *
 * @param children - The link's label
 * @returns The link
 */
export const EmptyStateLink = ({ children, className, to }: Props) => {
  return (
    <Link className={clsx(styles.link, className)} to={to}>
      {children}
      <LinkArrow />
    </Link>
  )
}
