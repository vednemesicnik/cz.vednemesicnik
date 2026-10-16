import { clsx } from 'clsx'
import type { ComponentProps } from 'react'

import styles from './_styles.module.css'

type Props = Omit<ComponentProps<'button'>, 'type'> & {
  /** A format in force where the cursor is: grey background (24a). */
  active?: boolean
  /** The name of a button without words, e.g. *Tučné* (jb81di02). */
  label?: string
  /** Its keyboard shortcut, added to the native tooltip. */
  shortcut?: string
}

/**
 * A button of `TextEditorToolbar`. One without a visible word is named by
 * `label`; a format button says whether it is on (`aria-pressed`).
 */
export const TextEditorToolbarButton = ({
  children,
  className,
  active,
  label,
  shortcut,
  ...rest
}: Props) => (
  <button
    aria-label={label}
    aria-pressed={active}
    className={clsx(styles.button, active && styles.active, className)}
    // Until the Tooltip (#680).
    title={
      label === undefined
        ? undefined
        : shortcut === undefined
          ? label
          : `${label} (${shortcut})`
    }
    type={'button'}
    {...rest}
  >
    {children}
  </button>
)
