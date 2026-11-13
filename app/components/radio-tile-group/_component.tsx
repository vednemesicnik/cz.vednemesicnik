import { clsx } from 'clsx'
import type { ComponentProps, ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = ComponentProps<'fieldset'> & {
  children: ReactNode
}

/**
 * A choice of one as tiles, two to a row: the design system's
 * `RadioOptionGroup` with `variant="tile"` (15f). A fieldset, so its legend
 * names the choice; a legend only a screen reader needs goes in
 * `VisuallyHidden`.
 *
 * @example
 * ```tsx
 * <RadioTileGroup>
 *   <legend><VisuallyHidden>Rychlá volba</VisuallyHidden></legend>
 *   <RadioTile name={'amount'} value={'150'}>150 Kč</RadioTile>
 * </RadioTileGroup>
 * ```
 *
 * @param props.children - The legend first, then the {@link RadioTile}s.
 */
export const RadioTileGroup = ({ children, className, ...rest }: Props) => (
  <fieldset className={clsx(styles.group, className)} {...rest}>
    {children}
  </fieldset>
)
