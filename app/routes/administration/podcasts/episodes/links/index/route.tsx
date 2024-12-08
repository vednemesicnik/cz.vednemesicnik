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
  const { episode, podcast } = loaderData

  const { idForDeletion, isModalOpen, openModal, closeModal } =
    useDeleteConfirmation()

  return (
    <>
      <Headline>{episode.title}</Headline>
      <NavLink
        to={`/administration/podcasts/${podcast.id}/${episode.id}/add-link`}
        preventScrollReset={true}
      >
        Přidat odkaz
      </NavLink>
      <hr />
      <table>
        <thead>
          <tr>
            <th>Štítek</th>
            <th>URL</th>
            <th>Akce</th>
          </tr>
        </thead>
        <tbody>
          {episode.links.map((link) => {
            const editLinkPath = `/administration/podcasts/${podcast.id}/${episode.id}/edit-link/${link.id}`

            return (
              <tr key={link.id}>
                <td>{link.label}</td>
                <td>{link.url}</td>
                <td>
                  <Actions
                    editPath={editLinkPath}
                    onDelete={openModal(link.id)}
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
export { meta } from "./_meta"
