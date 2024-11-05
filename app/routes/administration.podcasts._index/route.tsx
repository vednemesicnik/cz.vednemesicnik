import { Link, useLoaderData } from "@remix-run/react"

import { Actions } from "~/components/actions"
import {
  DeleteConfirmationModal,
  useDeleteConfirmation,
} from "~/components/delete-confirmation-modal"

import { type loader } from "./loader"

export default function Route() {
  const loaderData = useLoaderData<typeof loader>()

  const { idForDeletion, isModalOpen, openModal, closeModal } =
    useDeleteConfirmation()

  return (
    <>
      <h1>Administrace Podcastů</h1>
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
