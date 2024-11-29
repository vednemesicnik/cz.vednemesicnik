import { Link, useLoaderData } from "@remix-run/react"

import { Actions } from "~/components/actions"
import {
  DeleteConfirmationModal,
  useDeleteConfirmation,
} from "~/components/delete-confirmation-modal"
import { routesConfig } from "~/config/routes-config"
import { getRights } from "~/utils/permissions"

import { type loader } from "./_loader"

export default function Route() {
  const loaderData = useLoaderData<typeof loader>()
  const { idForDeletion, isModalOpen, openModal, closeModal } =
    useDeleteConfirmation()

  const addArchivedIssuePath =
    routesConfig.administration.archive.addArchivedIssue.staticPath

  const { user } = loaderData.session

  const [[hasCreateRight]] = getRights(user.author.role.permissions, {
    actions: ["create"],
    access: ["own", "any"],
    // there is no need to compare ownAuthorId with targetAuthorId
  })

  return (
    <>
      <h3>Archiv</h3>
      {hasCreateRight && <Link to={addArchivedIssuePath}>Přidat výtisk</Link>}
      <hr />
      <table>
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

            const [[hasUpdateRight, hasDeleteRight]] = getRights(
              user.author.role.permissions,
              {
                actions: ["update", "delete"],
                access: ["own", "any"],
                ownId: user.author.id,
                targetId: issue.author.id,
              }
            )

            return (
              <tr key={issue.id}>
                <td>{issue.label}</td>
                <td>{issue.state}</td>
                <td>
                  <Actions
                    canEdit={hasUpdateRight}
                    editPath={editArchivedIssuePath}
                    canDelete={hasDeleteRight}
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

export { meta } from "./_meta"
export { loader } from "./_loader"
export { action } from "./_action"
