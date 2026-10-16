import { clsx } from 'clsx'
import type { ComponentProps } from 'react'

import styles from './_styles.module.css'

type Props = ComponentProps<'li'> & {
  /** The row and the field that replaces its author, in one frame (24j). */
  isReplacing?: boolean
}

/**
 * One chosen author of an article (design 24j, ivyin4kr): an `AuthorRow`, and
 * while replacing the field under it, framed together.
 *
 * @param props.isReplacing - Frames the row with the replace field.
 */
export const AuthorListItem = ({
  isReplacing = false,
  className,
  children,
  ...rest
}: Props) => (
  <li
    className={clsx(styles.item, isReplacing && styles.replacing, className)}
    {...rest}
  >
    {children}
  </li>
)
