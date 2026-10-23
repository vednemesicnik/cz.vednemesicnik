import { clsx } from 'clsx'
import type { ComponentProps, ReactNode } from 'react'
import { Link } from '~/components/link'
import { LinkArrow } from '~/components/link-arrow'
import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
  link: {
    label: string
    to: ComponentProps<typeof Link>['to']
  }
}

/**
 * One sentence in place of an empty list, with a way on (design 11b, 11c):
 * "Tady zatím žádný článek není." + "Všechny články →".
 *
 * @param children - The sentence
 * @param link - Where to go instead; its arrow is hidden from screen readers
 * @returns The empty state
 */
export const EmptyState = ({ children, className, link }: Props) => {
  return (
    <div className={clsx(styles.emptyState, className)}>
      <p className={styles.text}>{children}</p>
      <Link className={styles.link} to={link.to}>
        {link.label}
        <LinkArrow />
      </Link>
    </div>
  )
}
