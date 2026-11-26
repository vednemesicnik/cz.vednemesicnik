import type { ReactNode } from 'react'
import { BadgeList } from '~/components/badge-list'
import styles from './_styles.module.css'

type Props = {
  children: ReactNode
}

/**
 * The row's categories: a {@link BadgeList} on its own line between the title and
 * the author with the date. Pass `Badge`s without `to`, since the whole row is the
 * link (design 2u868pc9).
 */
export const ContentLinkCategories = ({ children }: Props) => {
  return <BadgeList className={styles.list}>{children}</BadgeList>
}
