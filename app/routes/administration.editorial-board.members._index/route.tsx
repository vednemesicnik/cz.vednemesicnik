import { NavLink, useLoaderData } from "@remix-run/react"

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
      <h3>Členové</h3>
      <NavLink
        to={"/administration/editorial-board/members/add-member"}
        preventScrollReset={true}
      >
        Přidat člena
      </NavLink>
      <hr />
      <table>
        <thead>
          <tr>
            <th>Jméno</th>
            <th>Pozice</th>
            <th>Akce</th>
          </tr>
        </thead>
        <tbody>
          {loaderData.editoiralBoardMembers.map((member) => {
            const editMemberPath = `/administration/editorial-board/members/edit-member/${member.id}`

            return (
              <tr key={member.id}>
                <td>{member.fullName}</td>
                <td>
                  {member.positions.map((position) => position.key).join(", ")}
                </td>
                <td>
                  <Actions
                    editPath={editMemberPath}
                    onDelete={openModal(member.id)}
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

export { meta } from "./_meta"
export { loader } from "./_loader"
export { action } from "./_action"
