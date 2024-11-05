import { NavLink, useLoaderData } from "@remix-run/react"

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
      <h1>Administrace Podcastu {loaderData.podcast.title}</h1>
      <NavLink
        to={`/administration/podcasts/${loaderData.podcast.id}/add-episode`}
        preventScrollReset={true}
      >
        Přidat epizodu
      </NavLink>
      <hr />
      <table>
        <thead>
          <tr>
            <th>Název</th>
            <th>Publikováno</th>
            <th>Publikováno dne</th>
            <th>Akce</th>
          </tr>
        </thead>
        <tbody>
          {loaderData.podcast.episodes.map((episode) => {
            const editEpisodePath = `/administration/podcasts/${loaderData.podcast.id}/edit-episode/${episode.id}`

            return (
              <tr key={episode.id}>
                <td>
                  <NavLink
                    to={`/administration/podcasts/${loaderData.podcast.id}/${episode.id}`}
                  >
                    {episode.title}
                  </NavLink>
                </td>
                <td>{episode.published ? "🟢" : "🔴"}</td>
                <td>
                  {episode.publishedAt
                    ? new Date(episode.publishedAt).toLocaleDateString("cs-CZ")
                    : "Nepublikováno"}
                </td>
                <td>
                  <Actions
                    editPath={editEpisodePath}
                    onDelete={openModal(episode.id)}
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
