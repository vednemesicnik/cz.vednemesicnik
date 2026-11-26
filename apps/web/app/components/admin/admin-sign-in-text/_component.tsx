import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Variant = 'text' | 'note' | 'quiet'

type Props = {
  children: ReactNode
  variant?: Variant
  className?: string
}

/**
 * A centred sentence in `AdminSignInCard`, as the design system's
 * `vdm-signin__text`, `__note` and `__note--quiet` (0zgyl1ao).
 *
 * @param props.variant - `text` for the card's sentence (14 px), `note` for a
 * smaller one under the action (13 px), `quiet` for a note in the tertiary
 * colour.
 */
export const AdminSignInText = ({
  children,
  variant = 'text',
  className,
}: Props) => (
  <p
    className={clsx(
      styles.text,
      variant !== 'text' && styles[variant],
      className,
    )}
  >
    {children}
  </p>
)
