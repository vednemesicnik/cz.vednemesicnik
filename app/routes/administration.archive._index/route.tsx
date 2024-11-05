import { NavLink, useLoaderData } from "@remix-run/react"

import { Actions } from "~/components/actions"
import {
  DeleteConfirmationModal,
  useDeleteConfirmation,
} from "~/components/delete-confirmation-modal"
import { routesConfig } from "~/config/routes-config"

import { type loader } from "./loader"

export default function Route() {
  const loaderData = useLoaderData<typeof loader>()
  const { idForDeletion, isModalOpen, openModal, closeModal } =
    useDeleteConfirmation()

  const addArchivedIssuePath =
    routesConfig.administration.archive.addArchivedIssue.staticPath

  return (
    <>
      <h1>Administrace Archivu</h1>
      <NavLink to={addArchivedIssuePath} preventScrollReset={true}>
        Přidat výtisk
      </NavLink>
      <hr />
      <table style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>Název</th>
            <th>Zveřejněno</th>
            <th>Akce</th>
          </tr>
        </thead>
        <tbody>
          {loaderData.archivedIssues.map((issue) => {
            const editArchivedIssuePath =
              routesConfig.administration.archive.editArchivedIssue.getStaticPath(
                issue.id
              )

            return (
              <tr key={issue.id}>
                <td>{issue.label}</td>
                <td>{issue.published ? "🟢" : "🔴"}</td>
                <td>
                  <Actions
                    editPath={editArchivedIssuePath}
                    onDelete={openModal(issue.id)}
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
