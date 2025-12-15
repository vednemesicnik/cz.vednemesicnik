// noinspection JSUnusedGlobalSymbols

import { useRef } from "react"
import { href } from "react-router"

import { AdminActionButton } from "~/components/admin-action-button"
import { AdminActionGroup } from "~/components/admin-action-group"
import {
  AdminDeleteConfirmationDialog,
  useAdminDeleteConfirmationDialog,
} from "~/components/admin-delete-confirmation-dialog"
import { AdminDetailItem } from "~/components/admin-detail-item"
import { AdminDetailList } from "~/components/admin-detail-list"
import { AdminDetailSection } from "~/components/admin-detail-section"
import { AdminHeadline } from "~/components/admin-headline"
import { AdminLinkButton } from "~/components/admin-link-button"
import { AdminPage } from "~/components/admin-page"
import { DeleteIcon } from "~/components/icons/delete-icon"
import { EditIcon } from "~/components/icons/edit-icon"

import type { Route } from "./+types/route"

export { action } from "./_action"
export { loader } from "./_loader"
export { meta } from "./_meta"

export default function RouteComponent({
  loaderData,
  params,
}: Route.ComponentProps) {
  const { user, canUpdate, canDelete } = loaderData
  const { userId } = params

  const deleteConfirmationDialogRef = useRef<HTMLDialogElement>(null)

  const { openDialog } = useAdminDeleteConfirmationDialog(
    deleteConfirmationDialogRef,
    {
      action: href("/administration/users/:userId", { userId }),
      withRedirect: true,
    }
  )

  // Map role names to Czech
  const roleNames: Record<string, string> = {
    owner: "Vlastník",
    administrator: "Administrátor",
    member: "Člen",
  }

  const authorRoleNames: Record<string, string> = {
    coordinator: "Koordinátor",
    creator: "Tvůrce",
    contributor: "Přispěvatel",
  }

  return (
    <AdminPage>
      <AdminHeadline>{user.name}</AdminHeadline>

      <AdminActionGroup>
        {canUpdate && (
          <AdminLinkButton
            to={href("/administration/users/:userId/edit-user", {
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

      <AdminDetailSection title="Základní informace">
        <AdminDetailList>
          <AdminDetailItem label="Jméno">{user.name}</AdminDetailItem>
          <AdminDetailItem label="E-mail">{user.email}</AdminDetailItem>
          <AdminDetailItem label="Uživatelské jméno">
            {user.username}
          </AdminDetailItem>
          <AdminDetailItem label="Uživatelská role">
            {roleNames[user.role.name] ?? user.role.name}
          </AdminDetailItem>
        </AdminDetailList>
      </AdminDetailSection>

      <AdminDetailSection title="Autorský profil">
        <AdminDetailList>
          <AdminDetailItem label="Jméno autora">
            {user.author.name}
          </AdminDetailItem>
          <AdminDetailItem label="Autorská role">
            {authorRoleNames[user.author.role.name] ?? user.author.role.name}
          </AdminDetailItem>
        </AdminDetailList>
      </AdminDetailSection>

      <AdminDetailSection title="Metadata">
        <AdminDetailList>
          <AdminDetailItem label="Vytvořeno">{user.createdAt}</AdminDetailItem>
          <AdminDetailItem label="Naposledy upraveno">
            {user.updatedAt}
          </AdminDetailItem>
        </AdminDetailList>
      </AdminDetailSection>

      <AdminDeleteConfirmationDialog ref={deleteConfirmationDialogRef} />
    </AdminPage>
  )
}
