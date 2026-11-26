import { clsx } from 'clsx'
import { Children, type ReactNode } from 'react'
import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * A flex-wrapping list of {@link Badge} items (article categories or tags).
 * Renders a real `ul`/`li` list for accessibility and wraps each child in an
 * `li` itself, so call sites can pass badges directly. Keeps spacing consistent
 * across the article detail and the listing cards.
 */
export const BadgeList = ({ children, className }: Props) => {
  return (
    <ul className={clsx(styles.list, className)}>
      {Children.map(children, (child) => (
        <li className={styles.item}>{child}</li>
      ))}
    </ul>
  )
}
