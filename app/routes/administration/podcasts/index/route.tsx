// noinspection JSUnusedGlobalSymbols

import { Link } from "react-router"

import { Actions } from "~/components/actions"
import {
  DeleteConfirmationModal,
  useDeleteConfirmation,
} from "~/components/delete-confirmation-modal"

import type { Route } from "./+types/route"

export default function Route({ loaderData }: Route.ComponentProps) {
  const { idForDeletion, isModalOpen, openModal, closeModal } =
    useDeleteConfirmation()

  return (
    <>
      <h3>Podcasty</h3>
      <Link
        to={`/administration/podcasts/add-podcast`}
        preventScrollReset={true}
      >
        Přidat podcast
      </Link>
      <hr />
      <table>
        <thead>
          <tr>
            <th>Název</th>
            <th>Akce</th>
          </tr>
        </thead>
        <tbody>
          {loaderData.podcasts.map((podcast) => {
            const editPodcastPath = `/administration/podcasts/edit-podcast/${podcast.id}`

            return (
              <tr key={podcast.id}>
                <td>
                  <Link to={`/administration/podcasts/${podcast.id}`}>
                    {podcast.title}
                  </Link>
                </td>
                <td>
                  <Actions
                    editPath={editPodcastPath}
                    onDelete={openModal(podcast.id)}
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
