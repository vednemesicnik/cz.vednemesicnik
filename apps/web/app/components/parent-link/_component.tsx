import { clsx } from 'clsx'
import type { ReactNode } from 'react'
import { BaseLink } from '~/components/base-link'
import { useReturnLink } from '~/hooks/use-return-link'
import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
  to: string
}

/**
 * The link one level up, above a page headline: "‹ Rubriky" (design 11b).
 *
 * A plain link to the parent page, never a step back in history. Opened
 * straight from the parent's list in this tab, it leads back to that list as
 * the reader left it, its page and scroll position (30i, n3wa2ld4); otherwise
 * to the parent's bare address. Its name is always the parent's. The arrow is
 * hidden from screen readers; the accessible name is the parent's name alone.
 *
 * @param children - The parent page's name
 * @param to - The parent page's path
 * @returns The parent link
 */
export const ParentLink = ({ children, className, to }: Props) => {
  const { href, state } = useReturnLink(to)

  return (
    <BaseLink className={clsx(styles.link, className)} state={state} to={href}>
      <span aria-hidden={true}>‹</span>
      <span>{children}</span>
    </BaseLink>
  )
}
