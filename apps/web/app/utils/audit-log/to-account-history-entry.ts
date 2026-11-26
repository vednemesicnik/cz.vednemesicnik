import type {
  AuditLogEvent,
  AuthorRoleName,
  UserRoleName,
} from '@generated/prisma/enums'

import { formatNumericDateTime } from '~/utils/format-numeric-date-time'
import { getAuthorRoleLabel, getUserRoleLabel } from '~/utils/role-labels'

export type AccountHistoryEntry = {
  id: string
  dateTime: string
  formattedDateTime: string
  label: string
  actorName: string | null
}

type AuditLogRow = {
  id: string
  createdAt: Date
  event: AuditLogEvent
  detail: string | null
}

type HistoryEvent = Exclude<AuditLogEvent, 'user_deleted'>

// `formatRoleChangeDetail` writes "role: member → administrator".
const ROLE_CHANGE_DETAIL = /^role: (\w+) → (\w+)$/

const isUserRoleName = (name: string): name is UserRoleName =>
  name === 'owner' || name === 'administrator' || name === 'member'

const isAuthorRoleName = (name: string): name is AuthorRoleName =>
  name === 'coordinator' || name === 'creator' || name === 'contributor'

// „<role>: nová, dříve stará“ in the nominative, the new role first; an
// unreadable detail keeps only the prefix (by062t6n).
const formatRoleChange = (
  prefix: string,
  detail: string | null,
  getLabel: (name: string) => string | null,
) => {
  const match = detail?.match(ROLE_CHANGE_DETAIL)
  const from = match ? getLabel(match[1]) : null
  const to = match ? getLabel(match[2]) : null

  return from === null || to === null
    ? prefix
    : `${prefix}: ${to}, dříve ${from}`
}

const labels: Record<HistoryEvent, (detail: string | null) => string> = {
  // The author's detail only (28b); the account has Účet založen.
  author_created: () => 'Vytvořeno',
  author_role_changed: (detail) =>
    formatRoleChange('Autorská role', detail, (name) =>
      isAuthorRoleName(name) ? getAuthorRoleLabel(name) : null,
    ),
  emergency_link_issued: () => 'Nouzový odkaz vydán',
  user_created: () => 'Účet založen',
  // No address: the current one stands under the name (28e, copy 2zn4atua).
  user_email_changed: () => 'Přihlašovací e-mail změněn',
  user_role_changed: (detail) =>
    formatRoleChange('Uživatelská role', detail, (name) =>
      isUserRoleName(name) ? getUserRoleLabel(name) : null,
    ),
}

/**
 * Turns an `AuditLog` row into a row of the account's history (design 28e,
 * by062t6n): a label and the name of whoever did it.
 *
 * @param row - The row's id, time, event and detail.
 * @param actorName - The actor's author name, `null` once their account is
 *   deleted: the label then stands alone.
 * @returns The entry, or `null` for `user_deleted`, which no detail shows.
 */
export const toAccountHistoryEntry = (
  row: AuditLogRow,
  actorName: string | null,
): AccountHistoryEntry | null => {
  if (row.event === 'user_deleted') return null

  return {
    actorName,
    dateTime: row.createdAt.toISOString(),
    formattedDateTime: formatNumericDateTime(row.createdAt),
    id: row.id,
    label: labels[row.event](row.detail),
  }
}
