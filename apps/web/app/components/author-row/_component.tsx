import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * An author's row (design 24j, 28f): the avatar, the name, *vy* for one's own
 * row or a note such as the role, and the row's actions at the end. Short of
 * room, the note moves under the name before a word breaks.
 *
 * @param props.children - The `AuthorRowAvatar`, the `AuthorRowText` with the
 *   `AuthorRowName` and its `AuthorRowNote`s, then the actions, never
 *   disabled: one in 24j, an `AuthorRemoveButton` or an `AuthorRowButton`; in
 *   28f *Změnit* and then the × (nstqrn5g). Without one the row has none.
 */
export const AuthorRow = ({ children, className }: Props) => (
  <div className={clsx(styles.row, className)}>{children}</div>
)
