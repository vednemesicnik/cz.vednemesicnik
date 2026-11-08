import { clsx } from 'clsx'
import type { ComponentProps, ReactNode } from 'react'
import { Link } from '~/components/link'
import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
  isPreview?: boolean
  to: ComponentProps<typeof Link>['to']
}

/**
 * One example link in `LinkStripLinks`, e.g. a tag.
 *
 * @param props.children - The link's label
 * @param props.isPreview - Something the reader doesn't see, framed on its
 *   own edge (11e)
 * @returns The link
 */
export const LinkStripLink = ({
  children,
  className,
  isPreview = false,
  to,
}: Props) => {
  return (
    <Link className={clsx(isPreview && styles.preview, className)} to={to}>
      {children}
    </Link>
  )
}
