import { clsx } from 'clsx'

import { CloseIcon } from '~/components/icons/close-icon'
import { Tooltip } from '~/components/tooltip'

import styles from './_styles.module.css'

type Props = {
  /** The author's name, for the button's name *Odebrat …*. */
  name: string
  /** Removes the author; no confirmation, it can be added back (24j). */
  onClick: () => void
  className?: string
}

/**
 * The × at the end of an `AuthorRow` (design 24j, 28f): last on the row,
 * after *Změnit* where there is one (nstqrn5g). An icon without a word, so
 * its name shows in a `Tooltip` too (jb81di02).
 */
export const AuthorRemoveButton = ({ name, onClick, className }: Props) => {
  const label = `Odebrat ${name}`

  return (
    <Tooltip className={clsx(styles.anchor, className)} label={label}>
      <button
        aria-label={label}
        className={styles.remove}
        onClick={onClick}
        type={'button'}
      >
        <CloseIcon className={styles.icon} />
      </button>
    </Tooltip>
  )
}
