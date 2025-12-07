// noinspection JSUnusedGlobalSymbols

import { Link } from "react-router"

import { Actions } from "~/components/actions"
import {
  DeleteConfirmationModal,
  useDeleteConfirmation,
} from "~/components/admin-delete-confirmation-modal"
import { Headline } from "~/components/headline"
import { getUserRights } from "~/utils/get-user-rights"

import type { Route } from "./+types/route"

export default function Route({ loaderData }: Route.ComponentProps) {
  const { idForDeletion, isModalOpen, openModal, closeModal } =
    useDeleteConfirmation()

  const { permissions, level } = loaderData.session.user.role

  const [
    // entity: user
    [
      // action: create
      [
        // access: own
        hasCreateOwnUserRight,
        // access: any
        hasCreateAnyUserRight,
      ],
    ],
  ] = getUserRights(permissions, {
    entities: ["user"],
    actions: ["create"],
    access: ["own", "any"],
  })

  const canCreateUser = hasCreateOwnUserRight || hasCreateAnyUserRight

  return (
    <>
      <Headline>Uživatelé</Headline>
      {canCreateUser && (
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

            const [
              // entity: user
              [
                // action: update
                [
                  // access: own
                  hasUpdateOwnRight,
                  // access: any
                  hasUpdateAnyRight,
                ],
                // action: delete
                [
                  // access: own
                  hasDeleteOwnRight,
                  // access: any
                  hasDeleteAnyRight,
                ],
              ],
            ] = getUserRights(permissions, {
              entities: ["user"],
              actions: ["update", "delete"],
              access: ["own", "any"],
              ownId: loaderData.session.user.id,
              targetId: user.id,
            })

            const canUpdateUser =
              (hasUpdateOwnRight || hasUpdateAnyRight) &&
              user.role.level >= level
            const canDeleteUser =
              (hasDeleteOwnRight || hasDeleteAnyRight) &&
              user.role.level >= level

            return (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>{user.username}</td>
                <td>{user.name}</td>
                <td>{user.role.name}</td>
                <td>
                  <Actions
                    editPath={canUpdateUser ? editUserPath : undefined}
                    onDelete={canDeleteUser ? openModal(user.id) : undefined}
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
