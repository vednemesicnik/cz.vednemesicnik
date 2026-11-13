import { clsx } from 'clsx'
import type { ComponentProps, ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = Omit<ComponentProps<'input'>, 'type' | 'children'> & {
  children: ReactNode
}

/**
 * One tile of a {@link RadioTileGroup}: a bordered choice with its label in the
 * middle. The radio itself is hidden but stays in the tile, so the arrow keys
 * and screen readers work; the chosen tile gets the accent frame (15f).
 *
 * @param props.children - The tile's label
 */
export const RadioTile = ({ children, className, ...rest }: Props) => (
  <label className={clsx(styles.tile, className)}>
    <input className={styles.input} type={'radio'} {...rest} />
    {children}
  </label>
)
