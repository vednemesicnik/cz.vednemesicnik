import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  /** What the steps are of, for readers. */
  label: string
  /** `StepperStep`s, in order. */
  children: ReactNode
  className?: string
}

/**
 * The design system's `Stepper` (components/forms/Stepper, yv8gi9i0): the steps
 * of a multi-page form as an ordered list, each as wide as the others.
 */
export const Stepper = ({ label, children, className }: Props) => (
  <ol
    aria-label={label}
    className={clsx(styles.stepper, className)}
    // biome-ignore lint/a11y/noRedundantRoles: WebKit drops list semantics when list-style is none; the explicit role restores them for VoiceOver.
    role={'list'}
  >
    {children}
  </ol>
)
