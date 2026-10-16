import { clsx } from 'clsx'
import type { ComponentProps } from 'react'

import { Tooltip } from '~/components/tooltip'

import styles from './_styles.module.css'

type Props = Omit<ComponentProps<'button'>, 'type'> & {
  /** A format in force where the cursor is: grey background (24a). */
  active?: boolean
  /** The name of a button without words, e.g. *Tučné* (jb81di02). */
  label?: string
  /** Its keyboard shortcut in ARIA syntax, e.g. `Control+B`. */
  shortcut?: string
}

/**
 * A button of `TextEditorToolbar`. One without a visible word is named by
 * `label`, which its `Tooltip` shows; a format button says whether it is on
 * (`aria-pressed`).
 */
export const TextEditorToolbarButton = ({
  children,
  className,
  active,
  label,
  shortcut,
  ...rest
}: Props) => {
  const button = (
    <button
      aria-keyshortcuts={shortcut}
      aria-label={label}
      aria-pressed={active}
      className={clsx(styles.button, active && styles.active, className)}
      type={'button'}
      {...rest}
    >
      {children}
    </button>
  )

  return label === undefined ? (
    button
  ) : (
    <Tooltip className={styles.tooltip} label={label}>
      {button}
    </Tooltip>
  )
}
