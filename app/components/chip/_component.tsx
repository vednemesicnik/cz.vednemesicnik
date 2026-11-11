import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { CloseIcon } from '~/components/icons/close-icon'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  /** Still attached but out of play (archived): dashed, grey (24a). */
  muted?: boolean
  className?: string
} & (
  | {
      /** Makes the chip removable with a × button. */
      onRemove?: () => void
      /** The × button's name, e.g. *Odebrat {label}*. */
      removeLabel: string
    }
  | { onRemove?: never; removeLabel?: never }
)

/**
 * The design system's `Chip` (components/core/Chip, yv8gi9i0): a picked value
 * in a multi-select, removable with a ×.
 *
 * @param props.children - The `ChipLabel`, then a `ChipNote` where the value
 *   has one.
 */
export const Chip = ({
  children,
  muted = false,
  onRemove,
  removeLabel,
  className,
}: Props) => (
  <span className={clsx(styles.chip, muted && styles.muted, className)}>
    {children}
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
