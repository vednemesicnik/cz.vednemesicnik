// noinspection JSUnusedGlobalSymbols

import { useRef } from 'react'
import { href } from 'react-router'

import { AdminActionButton } from '~/components/admin-action-button'
import { AdminActionGroup } from '~/components/admin-action-group'
import {
  AdminDeleteConfirmationDialog,
  useAdminDeleteConfirmationDialog,
} from '~/components/admin-delete-confirmation-dialog'
import { AdminDetailItem } from '~/components/admin-detail-item'
import { AdminDetailList } from '~/components/admin-detail-list'
import { AdminDetailSection } from '~/components/admin-detail-section'
import { AdminHeadline } from '~/components/admin-headline'
import { AdminLinkButton } from '~/components/admin-link-button'
import { AdminPage } from '~/components/admin-page'
import { DeleteIcon } from '~/components/icons/delete-icon'
import { EditIcon } from '~/components/icons/edit-icon'
import { getAuthorRoleLabel } from '~/utils/role-labels'

import type { Route } from './+types/route'

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({
  loaderData,
  params,
}: Route.ComponentProps) {
  const { author, canUpdate, canDelete } = loaderData
  const { authorId } = params

  const deleteConfirmationDialogRef = useRef<HTMLDialogElement>(null)

  const { openDialog } = useAdminDeleteConfirmationDialog(
    deleteConfirmationDialogRef,
    {
      action: href('/administration/authors/:authorId', { authorId }),
      withRedirect: true,
    },
  )

  return (
    <AdminPage>
      <AdminHeadline>{author.name}</AdminHeadline>

      <AdminActionGroup>
        {canUpdate && (
          <AdminLinkButton
            to={href('/administration/authors/:authorId/edit-author', {
              authorId,
            })}
          >
            <EditIcon />
            Upravit
          </AdminLinkButton>
        )}
        {canDelete && (
          <AdminActionButton action="delete" onClick={openDialog}>
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
            <>
              <AdminDetailItem label="Jméno uživatele">
                {author.user.name}
              </AdminDetailItem>
              <AdminDetailItem label="E-mail">
                {author.user.email}
              </AdminDetailItem>
            </>
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
            {author.createdAt}
          </AdminDetailItem>
          <AdminDetailItem label="Naposledy upraveno">
            {author.updatedAt}
          </AdminDetailItem>
        </AdminDetailList>
      </AdminDetailSection>

      <AdminDeleteConfirmationDialog ref={deleteConfirmationDialogRef} />
    </AdminPage>
  )
}
