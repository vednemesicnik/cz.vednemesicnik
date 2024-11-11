import { Link, useLoaderData } from "@remix-run/react"

import { Actions } from "~/components/actions"
import {
  DeleteConfirmationModal,
  useDeleteConfirmation,
} from "~/components/delete-confirmation-modal"

import { type loader } from "./_loader"

export default function Route() {
  const loaderData = useLoaderData<typeof loader>()

  const { idForDeletion, isModalOpen, openModal, closeModal } =
    useDeleteConfirmation()

  return (
    <>
      <h3>Uživatelé</h3>
      <Link to={`/administration/users/add-user`}>Přidat uživatele</Link>
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
                    canEdit={user.role.name !== "owner"}
                    editPath={editUserPath}
                    canDelete={user.role.name !== "owner"}
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
