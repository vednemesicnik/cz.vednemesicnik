import { clsx } from 'clsx'

import { CloseIcon } from '~/components/icons/close-icon'

import styles from './_styles.module.css'

type Props = {
  children: string
  /** A word after the label, e.g. *archivovaný*. */
  note?: string
  /** Still attached but out of play (archived): dashed, grey (24a). */
  muted?: boolean
  /** Makes the chip removable with a × button. */
  onRemove?: () => void
  /** The × button's name; *Odebrat {label}* by default. */
  removeLabel?: string
  className?: string
}

/**
 * The design system's `Chip` (components/core/Chip, yv8gi9i0): a picked value
 * in a multi-select, removable with a ×.
 *
 * @param props.children - The value's name.
 */
export const Chip = ({
  children,
  note,
  muted = false,
  onRemove,
  removeLabel = `Odebrat ${children}`,
  className,
}: Props) => (
  <span className={clsx(styles.chip, muted && styles.muted, className)}>
    <span>{children}</span>
    {note !== undefined && <span className={styles.note}>{note}</span>}
    {onRemove !== undefined && (
      <button
        aria-label={removeLabel}
        className={styles.remove}
        onClick={onRemove}
        type={'button'}
      >
        <CloseIcon className={styles.removeIcon} />
      </button>
    )}
  </span>
)
