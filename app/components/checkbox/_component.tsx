import { clsx } from 'clsx'
import type { ComponentProps, ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = Omit<ComponentProps<'input'>, 'type' | 'children'> & {
  children: ReactNode
  hint?: ReactNode
}

/**
 * The design system's `Checkbox` (0zgyl1ao): the label is a sentence beside
 * the box, 14/400/1.4, with the box at its first line; an optional hint under
 * it. Every checkbox of the administration uses it.
 *
 * @param props.children - The sentence beside the box.
 * @param props.hint - A line under the sentence.
 */
export const Checkbox = ({ children, hint, className, ...rest }: Props) => (
  <label className={clsx(styles.checkbox, className)}>
    <input className={styles.input} type={'checkbox'} {...rest} />
    <span className={styles.text}>
      <span>{children}</span>
      {hint !== undefined && <span className={styles.hint}>{hint}</span>}
    </span>
  </label>
)
