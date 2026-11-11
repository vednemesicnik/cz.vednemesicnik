import { clsx } from 'clsx'
import type { ComponentProps, ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = Omit<ComponentProps<'input'>, 'type' | 'children'> & {
  children: ReactNode
}

/**
 * The design system's `Checkbox` (0zgyl1ao): the label is a sentence beside
 * the box, 14/400/1.4, with the box at its first line; an optional
 * `CheckboxHint` under it. Every checkbox of the administration uses it.
 *
 * @param props.children - The sentence beside the box, then an optional
 *   `CheckboxHint`.
 */
export const Checkbox = ({ children, className, ...rest }: Props) => (
  <label className={clsx(styles.checkbox, className)}>
    <input className={styles.input} type={'checkbox'} {...rest} />
    {/* Block flow, so inline children stay one sentence and a hint sits
        under it. */}
    <span className={styles.text}>{children}</span>
  </label>
)
