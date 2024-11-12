import { Link, useLoaderData } from "@remix-run/react"

import { Actions } from "~/components/actions"
import {
  DeleteConfirmationModal,
  useDeleteConfirmation,
} from "~/components/delete-confirmation-modal"
import { canCreate, canDelete, canUpdate } from "~/utils/permissions"

import { type loader } from "./_loader"

export default function Route() {
  const loaderData = useLoaderData<typeof loader>()

  const { idForDeletion, isModalOpen, openModal, closeModal } =
    useDeleteConfirmation()

  const permissions = loaderData.session.user.role.permissions
  const userId = loaderData.session.user.id

  const { canCreateOwn, canCreateAny } = canCreate(permissions)
  const { canUpdateOwn, canUpdateAny } = canUpdate(permissions, userId, userId)
  const { canDeleteOwn, canDeleteAny } = canDelete(permissions, userId, userId)

  return (
    <>
      <h3>Uživatelé</h3>
      {(canCreateOwn || canCreateAny) && (
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

            return (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>{user.username}</td>
                <td>{user.name}</td>
                <td>{user.role.name}</td>
                <td>
                  <Actions
                    canEdit={canUpdateOwn || canUpdateAny}
                    editPath={editUserPath}
                    canDelete={canDeleteOwn || canDeleteAny}
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
