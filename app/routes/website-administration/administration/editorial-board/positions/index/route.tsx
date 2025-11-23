// noinspection JSUnusedGlobalSymbols

import { NavLink } from "react-router"

import { Actions } from "~/components/actions"
import {
  DeleteConfirmationModal,
  useDeleteConfirmation,
} from "~/components/delete-confirmation-modal"
import { Headline } from "~/components/headline"

import type { Route } from "./+types/route"

export default function Route({ loaderData }: Route.ComponentProps) {
  const { idForDeletion, isModalOpen, openModal, closeModal } =
    useDeleteConfirmation()

  return (
    <>
      <Headline>Pozice</Headline>
      <NavLink
        to={"/administration/editorial-board/positions/add-position"}
        preventScrollReset={true}
      >
        Přidat pozici
      </NavLink>
      <hr />
      <table>
        <thead>
          <tr>
            <th>Klíč</th>
            <th>Označení v množném čísle</th>
            <th>Pořadí</th>
            <th>Akce</th>
          </tr>
        </thead>
        <tbody>
          {loaderData.editoiralBoardMemberPositions.map((position) => {
            const editPositionPath = `/administration/editorial-board/positions/edit-position/${position.id}`

            return (
              <tr key={position.id}>
                <td>{position.key}</td>
                <td>{position.pluralLabel}</td>
                <td>{position.order}</td>
                <td>
                  <Actions
                    editPath={editPositionPath}
                    onDelete={openModal(position.id)}
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

export { meta } from "./meta"
export { loader } from "./loader"
export { action } from "./action"
