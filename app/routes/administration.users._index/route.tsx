import { Link, useLoaderData } from "@remix-run/react"

import { Actions } from "~/components/actions"
import {
  DeleteConfirmationModal,
  useDeleteConfirmation,
} from "~/components/delete-confirmation-modal"
import { getRights } from "~/utils/permissions"
import { type PermissionEntity } from "~~/types/permission"
import { type RoleName } from "~~/types/role"

import { type loader } from "./_loader"

export default function Route() {
  const loaderData = useLoaderData<typeof loader>()

  const { idForDeletion, isModalOpen, openModal, closeModal } =
    useDeleteConfirmation()

  const permissions = loaderData.session.user.role.permissions
  const ownUserId = loaderData.session.user.id

  const [hasCreateRight] = getRights(permissions, {
    actions: ["create"],
    access: ["own", "any"],
    // there is no need to compare ownId with targetId
  })

  return (
    <>
      <h3>Uživatelé</h3>
      {hasCreateRight && (
        <Link to={`/administration/users/add-user`}>Přidat uživatele</Link>
      )}
      <br />
      <table>
        <thead>
          <tr>
            <th>E-mail</th>
            <th>Uživatelské jméno</th>
            <th>Jméno</th>
            <th>Oprávnění</th>
            <th>Akce</th>
          </tr>
        </thead>
        <tbody>
          {loaderData.users.map((user) => {
            const editUserPath = `/administration/users/edit-user/${user.id}`

            const mapRoleToEntity = (role: RoleName) => {
              const roleToEntity: Record<RoleName, PermissionEntity> = {
                owner: "user_owner",
                administrator: "user_administrator",
                editor: "user_editor",
                author: "user_author",
                contributor: "user_contributor",
              } as const

              return roleToEntity[role]
            }

            const entity = mapRoleToEntity(user.role.name as RoleName)

            const [hasUpdateRight] = getRights(permissions, {
              entities: [entity],
              actions: ["update"],
              access: ["own", "any"],
              ownId: ownUserId,
              targetId: user.id,
            })

            const [hasDeleteRight] = getRights(permissions, {
              entities: [entity],
              actions: ["delete"],
              access: ["own", "any"],
              ownId: ownUserId,
              targetId: user.id,
            })

            return (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>{user.username}</td>
                <td>{user.name}</td>
                <td>{user.role.name}</td>
                <td>
                  <Actions
                    canEdit={hasUpdateRight}
                    editPath={editUserPath}
                    canDelete={hasDeleteRight}
                    onDelete={openModal(user.id)}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <DeleteConfirmationModal
        id={idForDeletion}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </>
  )
}

export { action } from "./_action"
export { loader } from "./_loader"
