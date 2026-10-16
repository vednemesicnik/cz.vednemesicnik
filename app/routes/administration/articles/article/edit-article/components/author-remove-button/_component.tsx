import { clsx } from 'clsx'

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
    <svg
      aria-hidden={'true'}
      fill={'none'}
      height={14}
      stroke={'currentColor'}
      strokeLinecap={'round'}
      strokeWidth={2}
      viewBox={'0 0 24 24'}
      width={14}
    >
      <path d={'M18 6 6 18'} />
      <path d={'m6 6 12 12'} />
    </svg>
  </button>
)
