import type { ComponentProps } from 'react'
import { NavRowItem } from '~/components/nav-row-item'
import styles from './_styles.module.css'

type Props = Pick<ComponentProps<typeof NavRowItem>, 'children' | 'to'>

/**
 * The trailing secondary item of `NavRow`, e.g. „Všechny rubriky“ after the
 * categories (11a): the same pill in the secondary text colour.
 *
 * @param props.children - The item's label
 * @returns The list item
 */
export const NavRowMore = ({ children, to }: Props) => {
  return (
    <NavRowItem className={styles.more} to={to}>
      {children}
    </NavRowItem>
  )
}
