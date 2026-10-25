import { useRef } from 'react'
import { href, useFetcher, useNavigate } from 'react-router'

import { ActionMenu } from '~/components/action-menu'
import { useAdminDeleteConfirmationDialog } from '~/components/admin/admin-delete-confirmation-dialog'
import {
  TableActionsCell,
  TableCell,
  TableDetailsCell,
  TableDetailsLine,
  TableNameCell,
  TableNameNote,
  TableRow,
  TableRowLink,
  TableRowMenu,
} from '~/components/admin/admin-table'
import { BaseLink } from '~/components/base-link'
import { RETURN_TO_OPENER_STATE } from '~/utils/return-to-opener-state'

import { UserDeleteConfirmationDialog } from '../../../components/user-delete-confirmation-dialog'
import { formatLastSignIn } from '../../utils/format-last-sign-in'
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
 * change, such as the Owner's for an Administrator. Below 768 px it folds
 * into the name, the e-mail, both roles and the last sign-in, each on a line
 * of its own (32f, myx395rj).
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

  const lastSignInText = formatLastSignIn(lastSignIn, now)
  // Amber only for an invitation still waiting; an old account without a record is not waiting (cylr6mg1).
  const lastSignInClassName =
    lastSignIn.kind === 'never' ? styles.never : styles.lastSignIn

  return (
    <TableRow>
      <TableNameCell>
        <span className={styles.name}>
          {canView ? <TableRowLink to={detailHref}>{name}</TableRowLink> : name}
          {isOwn && (
            <>
              {' '}
              <span className={styles.own}>vy</span>
            </>
          )}
        </span>
        <TableNameNote>{email}</TableNameNote>
      </TableNameCell>
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
        <span className={lastSignInClassName}>{lastSignInText}</span>
      </TableCell>
      {/* The author role leads to the author from the user's detail on a
          phone (32f); a date gets the column's header, the rest reads alone
          (myx395rj). */}
      <TableDetailsCell>
        <TableDetailsLine>{`${roleName} · ${authorRoleName}`}</TableDetailsLine>
        <TableDetailsLine>
          {lastSignIn.kind === 'date' ? (
            `Poslední přihlášení: ${lastSignInText}`
          ) : (
            <span className={lastSignInClassName}>{lastSignInText}</span>
          )}
        </TableDetailsLine>
      </TableDetailsCell>
      <TableActionsCell>
        <TableRowMenu>
          <ActionMenu
            items={[
              ...(canUpdate
                ? [
                    {
                      label: 'Upravit',
                      onSelect: () =>
                        navigate(
                          href('/administration/users/:userId/edit', {
                            userId: id,
                          }),
                          { state: RETURN_TO_OPENER_STATE },
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
        </TableRowMenu>

        {/* The cell aligns right and doesn't wrap; its dialog shouldn't inherit that. */}
        <div className={styles.dialogs}>
          {canDelete && (
            <UserDeleteConfirmationDialog name={name} ref={dialogRef} />
          )}
        </div>
      </TableActionsCell>
    </TableRow>
  )
}
