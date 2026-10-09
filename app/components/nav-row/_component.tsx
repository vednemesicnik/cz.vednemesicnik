import { clsx } from 'clsx'
import type { ComponentProps } from 'react'
import { BaseLink } from '~/components/base-link'
import styles from './_styles.module.css'

type NavRowItem = {
  label: string
  to: ComponentProps<typeof BaseLink>['to']
}

type Props = {
  className?: string
  items: NavRowItem[]
  label: string
  more?: NavRowItem
}

/**
 * A row of plain links under a page headline, e.g. the categories on
 * `/articles` (design 11a, 11d). Not a filter: every item is its own page.
 *
 * From 768 px the links wrap after a visible label; below, they form one
 * sideways-scrolling row of 44 px pills cut off at the right edge.
 *
 * @param label - The visible label and the navigation's accessible name ("Rubriky")
 * @param items - The links, in display order
 * @param more - A trailing secondary link ("Všechny rubriky")
 * @returns The navigation row
 */
export const NavRow = ({ className, items, label, more }: Props) => {
  return (
    <nav aria-label={label} className={clsx(styles.row, className)}>
      <span aria-hidden={true} className={styles.label}>
        {label}
      </span>
      {items.map((item) => (
        <BaseLink className={styles.item} key={item.label} to={item.to}>
          {item.label}
        </BaseLink>
      ))}
      {more && (
        <BaseLink className={clsx(styles.item, styles.more)} to={more.to}>
          {more.label}
        </BaseLink>
      )}
    </nav>
  )
}
