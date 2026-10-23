import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { Avatar } from '~/components/avatar'
import type { ImageSources } from '~/utils/image-store/create-image-sources'

import styles from './_styles.module.css'

type Props = {
  name: string
  image: ImageSources
  /** The signed-in author's row, marked *vy*. */
  isOwn?: boolean
  /** A word after the name, such as the author's role (28f). */
  note?: string
  /**
   * At most one action at the end, never disabled (24j): an
   * `AuthorRemoveButton` or an `AuthorRowButton`. Without one the row has none.
   */
  children?: ReactNode
  className?: string
}

/**
 * An author's row (design 24j, 28f): the avatar, the name, *vy* for one's own
 * row or a note such as the role, and the row's one action at the end.
 */
export const AuthorRow = ({
  name,
  image,
  isOwn = false,
  note,
  children,
  className,
}: Props) => (
  <div className={clsx(styles.row, className)}>
    <Avatar image={image} name={name} size={28} />
    <span className={styles.name}>{name}</span>
    {isOwn && <span className={styles.note}>vy</span>}
    {note !== undefined && <span className={styles.note}>{note}</span>}
    {children}
  </div>
)
