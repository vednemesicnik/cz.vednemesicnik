import { useRef, useState } from 'react'
import { href, useFetcher, useNavigate } from 'react-router'

import { ActionMenu } from '~/components/action-menu'
import { useAdminDeleteConfirmationDialog } from '~/components/admin/admin-delete-confirmation-dialog'
import {
  TableActionsCell,
  TableCell,
  TableDetailsCell,
  TableDetailsLine,
  TableImageCell,
  TableNameCell,
  TableRow,
  TableRowLink,
  TableRowMenu,
  TableSelectionCell,
} from '~/components/admin/admin-table'
import { BaseLink } from '~/components/base-link'
import type { AuthorDeleteBlock } from '~/utils/author-references/get-author-delete-block'
import type { ImageSources } from '~/utils/image-store/create-image-sources'
import { RETURN_TO_OPENER_STATE } from '~/utils/return-to-opener-state'

import { AuthorAvatar } from '../../../components/author-avatar'
import { AuthorDeleteBlockedDialog } from '../../../components/author-delete-blocked-dialog'
import { AuthorDeleteConfirmationDialog } from '../../../components/author-delete-confirmation-dialog'
import { AUTHOR_CONTENT_SECTION_ID } from '../../../utils/author-content-section-id'
import { useAuthorDeleteRefusal } from '../../../utils/use-author-delete-refusal'
import styles from './_styles.module.css'

type Props = {
  id: string
  name: string
  image: ImageSources
  isAssociation: boolean
  isOwn: boolean
  roleName: string
  email: string | null
  publishedCount: number
  canView: boolean
  canUpdate: boolean
  canCreateUser: boolean
  canDelete: boolean
  mayDelete: boolean
  deleteBlock: AuthorDeleteBlock
  selected: boolean
  onSelect: () => void
}

/**
 * A row of the author list (design 28a): the avatar and the name opening the
 * detail, the author role, the account or „bez účtu“, the published count
 * leading to the detail, and every action in „⋯“ — an author has no state
 * waiting on a step, so the row has no primary action. Below 768 px it folds
 * into the avatar beside the name, the role, the published count in words
 * and the account, each on a line of its own (32e, myx395rj).
 */
export const ItemRow = ({
  id,
  name,
  image,
  isAssociation,
  isOwn,
  roleName,
  email,
  publishedCount,
  canView,
  canUpdate,
  canCreateUser,
  canDelete,
  mayDelete,
  deleteBlock,
  selected,
  onSelect,
}: Props) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const [isBlockedDialogOpen, setIsBlockedDialogOpen] = useState(false)
  const fetcherKey = `delete-author-${id}`
  const navigate = useNavigate()

  const fetcher = useFetcher({ key: fetcherKey })
  const isDeleting = fetcher.state !== 'idle'
  const { dismiss, refusal } = useAuthorDeleteRefusal(fetcherKey)

  const detailHref = href('/administration/authors/:authorId', { authorId: id })

  const { openDialog } = useAdminDeleteConfirmationDialog(dialogRef, {
    action: detailHref,
    key: fetcherKey,
  })

  return (
    <TableRow>
      <TableSelectionCell
        checked={selected}
        disabled={!canDelete}
        label={`Vybrat autora ${name}`}
        onChange={onSelect}
      />
      {/* A phone has the avatar in a column of its own (32e). */}
      <TableImageCell className={styles.phoneImage}>
        <AuthorAvatar
          image={image}
          isAssociation={isAssociation}
          name={name}
          size={28}
        />
      </TableImageCell>
      <TableNameCell>
        <span className={styles.name}>
          <span className={styles.wideAvatar}>
            <AuthorAvatar
              image={image}
              isAssociation={isAssociation}
              name={name}
              size={28}
            />
          </span>
          {canView ? (
            <TableRowLink className={styles.link} to={detailHref}>
              {name}
            </TableRowLink>
          ) : (
            name
          )}
          {isOwn && <span className={styles.own}>vy</span>}
        </span>
      </TableNameCell>
      <TableCell>{roleName}</TableCell>
      <TableCell>
        {email ?? <span className={styles.tertiary}>bez účtu</span>}
      </TableCell>
      <TableCell>
        {/* The detail breaks the count down by type (28a, 28b); a zero leads nowhere (25a). */}
        {publishedCount === 0 || !canView ? (
          <span className={publishedCount === 0 ? styles.tertiary : undefined}>
            {publishedCount.toLocaleString('cs-CZ')}
          </span>
        ) : (
          <BaseLink className={styles.count} to={detailHref}>
            {publishedCount.toLocaleString('cs-CZ')}
          </BaseLink>
        )}
      </TableCell>
      <TableDetailsCell>
        <TableDetailsLine>{roleName}</TableDetailsLine>
        {/* The desktop column's hint, word for word (myx395rj). */}
        <TableDetailsLine>
          {`Publikované články, epizody a čísla: ${publishedCount.toLocaleString('cs-CZ')}`}
        </TableDetailsLine>
        <TableDetailsLine>
          {email ?? <span className={styles.tertiary}>bez účtu</span>}
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
                          href('/administration/authors/:authorId/edit', {
                            authorId: id,
                          }),
                          { state: RETURN_TO_OPENER_STATE },
                        ),
                    },
                  ]
                : []),
              ...(canCreateUser
                ? [
                    {
                      label: 'Založit účet…',
                      onSelect: () =>
                        navigate(
                          `${href('/administration/users/new')}?${new URLSearchParams({ author: id })}`,
                          { state: RETURN_TO_OPENER_STATE },
                        ),
                    },
                  ]
                : []),
              // A blocked author gets the 28g explanation in place of the confirmation.
              ...(mayDelete && !isDeleting
                ? [
                    {
                      danger: true,
                      label: 'Smazat…',
                      onSelect: canDelete
                        ? openDialog
                        : () => setIsBlockedDialogOpen(true),
                    },
                  ]
                : []),
            ]}
            label={`Další akce s autorem ${name}`}
            size={'sm'}
          />
        </TableRowMenu>

        {/* The cell aligns right and doesn't wrap; its dialogs shouldn't inherit that. */}
        <div className={styles.dialogs}>
          {mayDelete && (
            <AuthorDeleteConfirmationDialog name={name} ref={dialogRef} />
          )}
          {(isBlockedDialogOpen || refusal !== null) && (
            <AuthorDeleteBlockedDialog
              block={refusal ?? deleteBlock}
              contentHref={`${detailHref}#${AUTHOR_CONTENT_SECTION_ID}`}
              name={name}
              onClose={() => {
                setIsBlockedDialogOpen(false)
                dismiss()
              }}
            />
          )}
        </div>
      </TableActionsCell>
    </TableRow>
  )
}
