import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  /** The table's column count, so the heading spans the whole row. */
  colSpan: number
}

/**
 * A subheading over a group of rows, such as a year of the archive (design
 * 26a). It heads its own `TableBody`, the group it names.
 */
export const TableGroupHeading = ({ children, colSpan }: Props) => (
  <tr>
    <th className={styles.groupHeading} colSpan={colSpan} scope={'rowgroup'}>
      {children}
    </th>
  </tr>
)
