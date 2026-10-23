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
   * The actions at the end, never disabled: one in 24j, an
   * `AuthorRemoveButton` or an `AuthorRowButton`; in 28f *Změnit* and then
   * the × (nstqrn5g). Without one the row has none.
   */
  children?: ReactNode
  className?: string
}

/**
 * An author's row (design 24j, 28f): the avatar, the name, *vy* for one's own
 * row or a note such as the role, and the row's actions at the end. Short of
 * room, the note moves under the name before a word breaks.
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
    <span className={styles.text}>
      <span className={styles.name}>{name}</span>
      {isOwn && <span className={styles.note}>vy</span>}
      {note !== undefined && <span className={styles.note}>{note}</span>}
    </span>
    {children}
  </div>
)
