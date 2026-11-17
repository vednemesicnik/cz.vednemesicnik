import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  /** Tiles to a row: 2 by default (amounts), 3 for years, 1 for longer labels. */
  columns?: 1 | 2 | 3
  className?: string
}

/**
 * The grid of a choice of one shown as tiles: the design system's
 * `RadioOptionGroup` with `variant="tile"` (15f). It names nothing itself, so
 * it goes inside a fieldset whose legend names the choice.
 *
 * @example
 * ```tsx
 * <RadioGroup>
 *   <RadioGroupLegend>Rok daru</RadioGroupLegend>
 *   <RadioTileGroup columns={3}>
 *     <RadioTile name={'year'} value={'2025'}>2025</RadioTile>
 *   </RadioTileGroup>
 * </RadioGroup>
 * ```
 *
 * @param props.children - The {@link RadioTile}s
 */
export const RadioTileGroup = ({ children, columns = 2, className }: Props) => (
  <div className={clsx(styles.group, styles[`columns${columns}`], className)}>
    {children}
  </div>
)
