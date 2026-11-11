import { clsx } from 'clsx'
import type { ComponentProps, ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = ComponentProps<'fieldset'> & {
  children: ReactNode
}

/**
 * A choice of one (design 28c): a fieldset whose legend reads like a field's
 * label, with its {@link Radio}s under it, 8 px apart. A note about the
 * choice, such as a `Callout`, goes in as a child after them.
 *
 * @example
 * ```tsx
 * <RadioGroup>
 *   <RadioGroupLegend>Role</RadioGroupLegend>
 *   <Radio name={'role'} value={'contributor'}>Přispěvatel</Radio>
 * </RadioGroup>
 * ```
 *
 * @param props.children - Its `RadioGroupLegend` first, then the radios and
 *   anything that belongs to them.
 */
export const RadioGroup = ({ children, className, ...rest }: Props) => (
  <fieldset className={clsx(styles.group, className)} {...rest}>
    {children}
  </fieldset>
)
