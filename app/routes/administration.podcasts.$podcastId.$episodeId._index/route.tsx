import { NavLink, useLoaderData } from "@remix-run/react"

import { Actions } from "~/components/actions"
import {
  DeleteConfirmationModal,
  useDeleteConfirmation,
} from "~/components/delete-confirmation-modal"
import { type loader } from "~/routes/administration.podcasts.$podcastId.$episodeId._index/loader"

export default function Route() {
  const { episode, podcast } = useLoaderData<typeof loader>()

  const { idForDeletion, isModalOpen, openModal, closeModal } =
    useDeleteConfirmation()

  return (
    <>
      <h3>Epizoda</h3>
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

export { meta } from "./meta"
export { loader } from "./loader"
export { action } from "./action"
