import { createContext, type ReactNode, useContext } from 'react'

import {
  TableCell,
  TableRow,
  type TableRowTint,
} from '~/components/admin/admin-table'

import { DASHBOARD_TYPE_COPY, type DashboardType } from '../../dashboard-types'
import styles from './_styles.module.css'

const Context = createContext<DashboardType | undefined>(undefined)

type Props = {
  /** What the row is: the type column says it, and the folded row over the name. */
  type: DashboardType
  muted?: boolean
  tint?: TableRowTint
  className?: string
  children: ReactNode
}

/**
 * A row of the dashboard (design 21a, 21b): the list's row with the type in
 * place of the author. The type comes first, written by the row itself. Then
 * come the name (`DashboardRowName`), the state cell and the row's
 * `DashboardRowActions`. Below 768 px the type stands in small print over the
 * name (21c, 22g).
 *
 * @param props.children - `DashboardRowName`, a `TableStateCell`, then
 *   `DashboardRowActions`.
 */
export const DashboardRow = ({
  type,
  muted = false,
  tint,
  className,
  children,
}: Props) => (
  <TableRow className={className} muted={muted} tint={tint}>
    <TableCell className={styles.type}>
      {DASHBOARD_TYPE_COPY[type].label}
    </TableCell>
    <Context.Provider value={type}>{children}</Context.Provider>
  </TableRow>
)

/**
 * The type of the `DashboardRow` a part is in.
 *
 * @returns The row's type
 */
export const useDashboardRow = () => {
  const type = useContext(Context)

  if (type === undefined) {
    throw new Error('useDashboardRow must be used within a DashboardRow')
  }

  return type
}
