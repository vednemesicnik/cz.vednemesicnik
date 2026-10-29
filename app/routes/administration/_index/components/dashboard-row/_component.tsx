import { clsx } from 'clsx'
import type { ReactNode } from 'react'

import {
  TableCell,
  TableNameCell,
  TableNameNote,
  TableNameType,
  TableRow,
  TableRowLink,
  type TableRowTint,
  TableStateCell,
} from '~/components/admin/admin-table'
import { StatusTag, type StatusTagState } from '~/components/status-tag'

import styles from './_styles.module.css'

type Props = {
  typeLabel: string
  title: string
  detailHref: string
  /** Under the name: what the row belongs to, and in the queue who wrote it. */
  note: string | null
  state: StatusTagState
  /** The one fact under the state tag. */
  detail: string | undefined
  muted?: boolean
  /** A draft without a title goes by its name, said quieter (22f). */
  isUntitled?: boolean
  tint?: TableRowTint
  /** The row's `DashboardRowActions`. */
  children: ReactNode
}

/**
 * A row of the dashboard (design 21a, 21b): the list's row with the type in
 * place of the author — the type, the name opening the detail over what it
 * belongs to, the state tag with one fact, and the row's actions. Below
 * 768 px the type stands in small print over the name (21c, 22g).
 */
export const DashboardRow = ({
  typeLabel,
  title,
  detailHref,
  note,
  state,
  detail,
  muted = false,
  isUntitled = false,
  tint,
  children,
}: Props) => (
  <TableRow muted={muted} tint={tint}>
    <TableCell className={styles.type}>{typeLabel}</TableCell>
    <TableNameCell>
      <TableNameType>{typeLabel}</TableNameType>
      <TableRowLink
        className={clsx(isUntitled && styles.untitled)}
        to={detailHref}
      >
        {title}
      </TableRowLink>
      {note !== null && <TableNameNote>{note}</TableNameNote>}
    </TableNameCell>
    <TableStateCell>
      <StatusTag detail={detail} state={state} />
    </TableStateCell>
    {children}
  </TableRow>
)
