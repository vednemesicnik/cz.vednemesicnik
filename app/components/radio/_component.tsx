import { clsx } from 'clsx'
import type { ComponentProps, ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = Omit<ComponentProps<'input'>, 'type' | 'children'> & {
  children: ReactNode
  hint?: ReactNode
}

/**
 * One choice of a {@link RadioGroup}, built like the design system's
 * `Checkbox` (0zgyl1ao): the label is a sentence beside the radio, 14/400/1.4,
 * with the radio at its first line; an optional hint under it (design 28c).
 *
 * @param props.children - The sentence beside the radio.
 * @param props.hint - A line under the sentence, e.g. what the choice allows.
 */
export const Radio = ({ children, hint, className, ...rest }: Props) => (
  <label className={clsx(styles.radio, className)}>
    <input className={styles.input} type={'radio'} {...rest} />
    <span className={styles.text}>
      <span>{children}</span>
      {hint !== undefined && <span className={styles.hint}>{hint}</span>}
    </span>
  </label>
)
