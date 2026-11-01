import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import { Link } from '~/components/link'

import styles from './_styles.module.css'

type Props = {
  /** The step's name. */
  children: ReactNode
} & (
  | { state: 'done'; to: string }
  | { state: 'current' | 'upcoming'; to?: never }
)

/**
 * One step of a `Stepper`. Shape and a word carry its state, colour only
 * strengthens them (yv8gi9i0): a done step has an outlined circle, a link back
 * and „hotovo“; the current one a full circle, a bold name, a thick line and
 * „teď“; an upcoming one a grey circle and plain text. The list numbers the
 * steps for readers, so the visible number is left out for them.
 */
export const StepperStep = ({ children, state, to }: Props) => (
  <li
    aria-current={state === 'current' ? 'step' : undefined}
    className={clsx(styles.step, styles[state])}
  >
    <span aria-hidden={true} className={styles.number} />
    <span className={styles.text}>
      {state === 'done' ? (
        <Link className={styles.link} to={to}>
          {children}
        </Link>
      ) : state === 'current' ? (
        <strong className={styles.currentName}>{children}</strong>
      ) : (
        <span className={styles.name}>{children}</span>
      )}
      {state === 'done' && <span className={styles.note}>hotovo</span>}
      {state === 'current' && <span className={styles.note}>teď</span>}
    </span>
  </li>
)
