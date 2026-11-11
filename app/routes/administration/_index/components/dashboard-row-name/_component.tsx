import type { ReactNode } from 'react'

import { TableNameCell, TableNameType } from '~/components/admin/admin-table'

import { DASHBOARD_TYPE_COPY } from '../../dashboard-types'
import { useDashboardRow } from '../dashboard-row'

type Props = {
  className?: string
  children: ReactNode
}

/**
 * The name cell of a `DashboardRow`: on a folded row the row's type in small
 * print first (21c), then the name.
 *
 * @param props.children - A `DashboardRowTitle`, then the `TableNameNote` with
 *   what the row belongs to, and in the queue who wrote it.
 */
export const DashboardRowName = ({ className, children }: Props) => {
  const type = useDashboardRow()

  return (
    <TableNameCell className={className}>
      <TableNameType>{DASHBOARD_TYPE_COPY[type].label}</TableNameType>
      {children}
    </TableNameCell>
  )
}
