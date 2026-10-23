import { clsx } from 'clsx'
import type { ComponentProps, ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = ComponentProps<'fieldset'> & {
  legend: ReactNode
  children: ReactNode
}

/**
 * A choice of one (design 28c): a fieldset whose legend reads like a field's
 * label, with its {@link Radio}s under it, 8 px apart. A note about the
 * choice, such as a `Callout`, goes in as a child after them.
 *
 * @param props.legend - The choice's name, as a field's label.
 * @param props.children - The radios, then anything that belongs to them.
 */
export const RadioGroup = ({ legend, children, className, ...rest }: Props) => (
  <fieldset className={clsx(styles.group, className)} {...rest}>
    <legend className={styles.legend}>{legend}</legend>
    {children}
  </fieldset>
)
