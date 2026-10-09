import { clsx } from 'clsx'
import type { ComponentProps, ReactNode } from 'react'
import { BaseLink } from '~/components/base-link'
import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
  to: ComponentProps<typeof BaseLink>['to']
}

/**
 * The link one level up, above a page headline: "‹ Rubriky" (design 11b).
 *
 * Always a plain link to the parent page, never a step back in history, so it
 * leads to the same place however the reader arrived. The arrow is hidden from
 * screen readers; the accessible name is the parent's name alone.
 *
 * @param children - The parent page's name
 * @param to - The parent page's path
 * @returns The parent link
 */
export const ParentLink = ({ children, className, to }: Props) => {
  return (
    <BaseLink className={clsx(styles.link, className)} to={to}>
      <span aria-hidden={true}>‹</span>
      <span>{children}</span>
    </BaseLink>
  )
}
