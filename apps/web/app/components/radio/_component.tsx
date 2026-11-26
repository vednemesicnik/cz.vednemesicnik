import { clsx } from 'clsx'
import type { ComponentProps, ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = Omit<ComponentProps<'input'>, 'type' | 'children'> & {
  children: ReactNode
}

/**
 * One choice of a {@link RadioGroup}, built like the design system's
 * `Checkbox` (0zgyl1ao): the label is a sentence beside the radio, 14/400/1.4,
 * with the radio at its first line; an optional `RadioHint` under it
 * (design 28c).
 *
 * @param props.children - The sentence beside the radio, then an optional
 *   `RadioHint`.
 */
export const Radio = ({ children, className, ...rest }: Props) => (
  <label className={clsx(styles.radio, className)}>
    <input className={styles.input} type={'radio'} {...rest} />
    {/* Block flow, so inline children stay one sentence and a hint sits
        under it. */}
    <span className={styles.text}>{children}</span>
  </label>
)
