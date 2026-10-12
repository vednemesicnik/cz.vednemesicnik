// noinspection JSUnusedGlobalSymbols

import { useEffect, useRef, useState } from 'react'
import { href, useLocation, useNavigate, useSearchParams } from 'react-router'

import { AdminActionButton } from '~/components/admin/admin-action-button'
import { AdminActionGroup } from '~/components/admin/admin-action-group'
import {
  AdminDeleteConfirmationDialog,
  useAdminDeleteConfirmationDialog,
} from '~/components/admin/admin-delete-confirmation-dialog'
import { AdminDetailItem } from '~/components/admin/admin-detail-item'
import { AdminDetailList } from '~/components/admin/admin-detail-list'
import { AdminDetailSection } from '~/components/admin/admin-detail-section'
import { AdminHeadline } from '~/components/admin/admin-headline'
import { AdminLinkButton } from '~/components/admin/admin-link-button'
import { AdminPage } from '~/components/admin/admin-page'
import { Callout } from '~/components/callout'
import { DeleteIcon } from '~/components/icons/delete-icon'
import { EditIcon } from '~/components/icons/edit-icon'
import { useToast } from '~/components/toast-provider'
import { INVITATION_CONFIG } from '~/config/invitation-config'
import { getAuthorRoleLabel, getUserRoleLabel } from '~/utils/role-labels'

import type { Route } from './+types/route'

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({
  loaderData,
  params,
}: Route.ComponentProps) {
  const { user, canUpdate, canDelete } = loaderData
  const { userId } = params

  const deleteConfirmationDialogRef = useRef<HTMLDialogElement>(null)

  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const showToast = useToast()

  // The one-shot result of „Vytvořit a pozvat“ (design 28e, p8x1s8gs), read
  // once and dropped from the address: a failure stays on screen until the
  // page is left, a reload no longer shows it.
  const [invitation] = useState(() => ({
    result: searchParams.get(INVITATION_CONFIG.resultParam),
    userId,
  }))
  const isInvitationFailed =
    invitation.userId === userId &&
    invitation.result === INVITATION_CONFIG.result.failed

  useEffect(() => {
    if (invitation.result === null) return

    if (invitation.result === INVITATION_CONFIG.result.sent) {
      showToast(`Pozvánka odešla na ${user.email}.`)
    }

    void navigate(location.pathname, {
      preventScrollReset: true,
      replace: true,
    })
  }, [invitation, location.pathname, navigate, showToast, user.email])

  const { openDialog } = useAdminDeleteConfirmationDialog(
    deleteConfirmationDialogRef,
    {
      action: href('/administration/users/:userId', { userId }),
      withRedirect: true,
    },
  )

  return (
    <AdminPage>
      <AdminHeadline>{user.author.name}</AdminHeadline>

      <AdminActionGroup>
        {canUpdate && (
          <AdminLinkButton
            to={href('/administration/users/:userId/edit-user', {
              userId,
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

      {isInvitationFailed && (
        <Callout tone={'warning'}>
          Účet je založený. Dejte pozvanému člověku vědět, ať se přihlásí přes
          Google nebo si na stránce přihlášení pošle odkaz — pozvánku na{' '}
          {user.email} se nepodařilo odeslat.
        </Callout>
      )}

      <AdminDetailSection title="Základní informace">
        <AdminDetailList>
          <AdminDetailItem label="E-mail">{user.email}</AdminDetailItem>
          <AdminDetailItem label="Uživatelské jméno">
            {user.username}
          </AdminDetailItem>
          <AdminDetailItem label="Uživatelská role">
            {getUserRoleLabel(user.role.name)}
          </AdminDetailItem>
        </AdminDetailList>
      </AdminDetailSection>

      <AdminDetailSection title="Autorský profil">
        <AdminDetailList>
          <AdminDetailItem label="Jméno autora">
            {user.author.name}
          </AdminDetailItem>
          <AdminDetailItem label="Autorská role">
            {getAuthorRoleLabel(user.author.role.name)}
          </AdminDetailItem>
        </AdminDetailList>
      </AdminDetailSection>

      <AdminDetailSection title="Metadata">
        <AdminDetailList>
          <AdminDetailItem label="Vytvořeno">
            {user.createdAt.formatted}
          </AdminDetailItem>
          <AdminDetailItem label="Naposledy upraveno">
            {user.updatedAt.formatted}
          </AdminDetailItem>
        </AdminDetailList>
      </AdminDetailSection>

      <AdminDeleteConfirmationDialog ref={deleteConfirmationDialogRef} />
    </AdminPage>
  )
}
