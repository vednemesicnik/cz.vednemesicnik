// noinspection JSUnusedGlobalSymbols

import { Link } from "react-router"

import { Actions } from "~/components/actions"
import {
  DeleteConfirmationModal,
  useDeleteConfirmation,
} from "~/components/delete-confirmation-modal"
import { Headline } from "~/components/headline"
import { getRights } from "~/utils/permissions"

import type { Route } from "./+types/route"

export default function Route({ loaderData }: Route.ComponentProps) {
  const { idForDeletion, isModalOpen, openModal, closeModal } =
    useDeleteConfirmation()

  const permissions = loaderData.session.user.role.permissions
  const ownUserId = loaderData.session.user.id

  const [[hasCreateRight]] = getRights(permissions, {
    actions: ["create"],
    access: ["own", "any"],
    // there is no need to compare ownId with targetId
  })

  return (
    <>
      <Headline>Uživatelé</Headline>
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

            const [[hasUpdateRight, hasDeleteRight]] = getRights(permissions, {
              actions: ["update", "delete"],
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
