import { clsx } from 'clsx'
import type { ComponentProps } from 'react'
import { BaseLink } from '~/components/base-link'
import styles from './_styles.module.css'

type Props = {
  children: string
  className?: string
  isCurrent?: boolean
  to: ComponentProps<typeof BaseLink>['to']
}

const isAnchor = (to: Props['to']) =>
  typeof to === 'string' && to.startsWith('#')

/**
 * One item of `NavRow`: a 44 px pill that links to its own page, or jumps to
 * a heading on this one (`#2012`).
 *
 * @param props.children - The item's label
 * @param props.isCurrent - Where the reader is: `aria-current` (`location` for
 *   a jump within the page, else `page`) and a tonal fill with no change of
 *   weight, so the row never shifts (d104jrnd)
 * @returns The list item
 */
export const NavRowItem = ({
  children,
  className,
  isCurrent = false,
  to,
}: Props) => {
  const isJump = isAnchor(to)

  return (
    <li className={styles.entry}>
      <BaseLink
        aria-current={isCurrent ? (isJump ? 'location' : 'page') : undefined}
        className={clsx(styles.item, className)}
        // A jump within the page (`#2012`) loads nothing to prefetch.
        prefetch={isJump ? 'none' : undefined}
        to={to}
      >
        {children}
      </BaseLink>
    </li>
  )
}
