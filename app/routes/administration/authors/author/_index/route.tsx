// noinspection JSUnusedGlobalSymbols

import { useRef, useState } from 'react'
import { href } from 'react-router'

import { AdminActionButton } from '~/components/admin/admin-action-button'
import { AdminActionGroup } from '~/components/admin/admin-action-group'
import {
  AdminDeleteConfirmationDialog,
  useAdminDeleteConfirmationDialog,
} from '~/components/admin/admin-delete-confirmation-dialog'
import { AdminDetailItem } from '~/components/admin/admin-detail-item'
import { AdminDetailList } from '~/components/admin/admin-detail-list'
import { AdminDetailSection } from '~/components/admin/admin-detail-section'
import { AdminPage } from '~/components/admin/admin-page'
import { DeleteIcon } from '~/components/icons/delete-icon'
import { EditIcon } from '~/components/icons/edit-icon'
import { LinkButton } from '~/components/link-button'
import { PageTitle } from '~/components/page-title'
import { getAuthorRoleLabel } from '~/utils/role-labels'

import { AuthorDeleteBlockedDialog } from '../../components/author-delete-blocked-dialog'
import { useAuthorDeleteRefusal } from '../../utils/use-author-delete-refusal'

import type { Route } from './+types/route'

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({
  loaderData,
  params,
}: Route.ComponentProps) {
  const { author, canUpdate, deleteBlock, mayDelete } = loaderData
  const { authorId } = params

  const deleteConfirmationDialogRef = useRef<HTMLDialogElement>(null)
  const [isBlockedDialogOpen, setIsBlockedDialogOpen] = useState(false)
  const deleteFetcherKey = `delete-author-${authorId}`
  const { dismiss, refusal } = useAuthorDeleteRefusal(deleteFetcherKey)

  const { openDialog } = useAdminDeleteConfirmationDialog(
    deleteConfirmationDialogRef,
    {
      action: href('/administration/authors/:authorId', { authorId }),
      key: deleteFetcherKey,
      withRedirect: true,
    },
  )

  return (
    <AdminPage measure={'text'}>
      <PageTitle>{author.name}</PageTitle>

      <AdminActionGroup>
        {canUpdate && (
          <LinkButton
            to={href('/administration/authors/:authorId/edit-author', {
              authorId,
            })}
            variant={'outline'}
          >
            <EditIcon />
            Upravit
          </LinkButton>
        )}
        {mayDelete && (
          <AdminActionButton
            action="delete"
            onClick={
              deleteBlock.deletable
                ? openDialog
                : () => setIsBlockedDialogOpen(true)
            }
          >
            <DeleteIcon />
            Smazat
          </AdminActionButton>
        )}
      </AdminActionGroup>

      <AdminDetailSection title="Základní informace">
        <AdminDetailList>
          <AdminDetailItem label="Jméno">{author.name}</AdminDetailItem>
          <AdminDetailItem label="Bio">{author.bio ?? '—'}</AdminDetailItem>
          <AdminDetailItem label="Role">
            {getAuthorRoleLabel(author.role.name)}
          </AdminDetailItem>
        </AdminDetailList>
      </AdminDetailSection>

      <AdminDetailSection title="Propojený uživatel">
        <AdminDetailList>
          {author.user ? (
            <AdminDetailItem label="E-mail">
              {author.user.email}
            </AdminDetailItem>
          ) : (
            <AdminDetailItem label="Uživatel">
              Autor není propojen s uživatelským účtem
            </AdminDetailItem>
          )}
        </AdminDetailList>
      </AdminDetailSection>

      <AdminDetailSection title="Metadata">
        <AdminDetailList>
          <AdminDetailItem label="Vytvořeno">
            {author.createdAt.formatted}
          </AdminDetailItem>
          <AdminDetailItem label="Naposledy upraveno">
            {author.updatedAt.formatted}
          </AdminDetailItem>
        </AdminDetailList>
      </AdminDetailSection>

      <AdminDeleteConfirmationDialog ref={deleteConfirmationDialogRef} />

      {/* Opened from the detail, it never offers Zobrazit obsah (dksfb82t). */}
      {(isBlockedDialogOpen || refusal !== null) && (
        <AuthorDeleteBlockedDialog
          block={refusal ?? deleteBlock}
          name={author.name}
          onClose={() => {
            setIsBlockedDialogOpen(false)
            dismiss()
          }}
        />
      )}
    </AdminPage>
  )
}
