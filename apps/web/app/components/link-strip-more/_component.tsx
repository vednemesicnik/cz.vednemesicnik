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
 * The trailing link of `LinkStrip` to the other index, e.g.
 * "Všechny štítky →" (11c). Its arrow is hidden from screen readers.
 *
 * @param props.children - The link's label
 * @returns The link
 */
export const LinkStripMore = ({ children, className, to }: Props) => {
  return (
    <Link className={clsx(styles.more, className)} to={to}>
      {children}
      <LinkArrow />
    </Link>
  )
}
