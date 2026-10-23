import { clsx } from 'clsx'

import { CloseIcon } from '~/components/icons/close-icon'

import styles from './_styles.module.css'

type Props = {
  /** The author's name, for the button's name *Odebrat …*. */
  name: string
  /** Removes the author; no confirmation, it can be added back (24j). */
  onClick: () => void
  className?: string
}

/**
 * The × at the end of an `AuthorRow` (design 24j).
 */
export const AuthorRemoveButton = ({ name, onClick, className }: Props) => (
  <button
    aria-label={`Odebrat ${name}`}
    className={clsx(styles.remove, className)}
    onClick={onClick}
    type={'button'}
  >
    <CloseIcon className={styles.icon} />
  </button>
)
