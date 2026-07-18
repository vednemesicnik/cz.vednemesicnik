import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  colSpan: number
  children?: ReactNode
}

export const TableEmptyRow = ({ colSpan, children = 'Žádná data' }: Props) => {
  return (
    <tr>
      <td className={styles.cell} colSpan={colSpan}>
        {children}
      </td>
    </tr>
  )
}
