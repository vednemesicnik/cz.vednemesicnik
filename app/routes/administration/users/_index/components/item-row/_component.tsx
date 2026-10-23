import { useRef } from 'react'
import { href, useFetcher, useNavigate } from 'react-router'

import { ActionMenu } from '~/components/action-menu'
import { useAdminDeleteConfirmationDialog } from '~/components/admin/admin-delete-confirmation-dialog'
import { TableCell, TableRow } from '~/components/admin/admin-table'
import { BaseLink } from '~/components/base-link'
import { AUTH_LOG_CONFIG } from '~/config/auth-log-config'
import { formatNumericDateOrToday } from '~/utils/format-numeric-date-or-today'

import { UserDeleteConfirmationDialog } from '../../../components/user-delete-confirmation-dialog'
import type { LastSignIn } from '../../utils/get-last-sign-in'
import styles from './_styles.module.css'

type Props = {
  id: string
  email: string
  name: string
  isOwn: boolean
  roleName: string
  authorId: string
  authorRoleName: string
  lastSignIn: LastSignIn
  now: Date
  canView: boolean
  canViewAuthor: boolean
  canUpdate: boolean
  canDelete: boolean
}

/**
 * A row of the users list (design 28d): the name opening the detail over the
 * e-mail, the user role, the author role leading to the author (28b), the
 * last sign-in, and the actions in „⋯“ — none on a row its viewer may not
 * change, such as the Owner's for an Administrator.
 */
export const ItemRow = ({
  id,
  email,
  name,
  isOwn,
  roleName,
  authorId,
  authorRoleName,
  lastSignIn,
  now,
  canView,
  canViewAuthor,
  canUpdate,
  canDelete,
}: Props) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const fetcherKey = `delete-user-${id}`
  const navigate = useNavigate()

  const fetcher = useFetcher({ key: fetcherKey })
  const isDeleting = fetcher.state !== 'idle'

  const detailHref = href('/administration/users/:userId', { userId: id })

  const { openDialog } = useAdminDeleteConfirmationDialog(dialogRef, {
    action: detailHref,
    key: fetcherKey,
  })

  return (
    <TableRow>
      <TableCell>
        <span className={styles.title}>
          <span className={styles.name}>
            {canView ? (
              <BaseLink className={styles.link} to={detailHref}>
                {name}
              </BaseLink>
            ) : (
              name
            )}
            {isOwn && (
              <>
                {' '}
                <span className={styles.own}>vy</span>
              </>
            )}
          </span>
          <span className={styles.email}>{email}</span>
        </span>
      </TableCell>
      <TableCell>{roleName}</TableCell>
      <TableCell>
        {canViewAuthor ? (
          <BaseLink
            className={styles.authorRole}
            to={href('/administration/authors/:authorId', { authorId })}
          >
            {authorRoleName}
          </BaseLink>
        ) : (
          authorRoleName
        )}
      </TableCell>
      <TableCell>
        {/* Amber only for an invitation still waiting; an old account without a record is not waiting (cylr6mg1). */}
        <span
          className={
            lastSignIn.kind === 'never' ? styles.never : styles.lastSignIn
          }
        >
          {lastSignIn.kind === 'date'
            ? formatNumericDateOrToday(lastSignIn.at, now)
            : lastSignIn.kind === 'never'
              ? 'zatím nikdy'
              : `${AUTH_LOG_CONFIG.retentionDays} dní bez přihlášení`}
        </span>
      </TableCell>
      <TableCell variant={'actions'}>
        <ActionMenu
          items={[
            ...(canUpdate
              ? [
                  {
                    label: 'Upravit',
                    onSelect: () =>
                      navigate(
                        href('/administration/users/:userId/edit-user', {
                          userId: id,
                        }),
                      ),
                  },
                ]
              : []),
            ...(canDelete && !isDeleting
              ? [{ danger: true, label: 'Smazat…', onSelect: openDialog }]
              : []),
          ]}
          label={`Další akce s účtem ${name}`}
          size={'sm'}
        />

        {/* The cell aligns right and doesn't wrap; its dialog shouldn't inherit that. */}
        <div className={styles.dialogs}>
          {canDelete && (
            <UserDeleteConfirmationDialog name={name} ref={dialogRef} />
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}
