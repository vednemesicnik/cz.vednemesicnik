import { Link, useLoaderData } from "@remix-run/react"

import { Actions } from "~/components/actions"
import {
  DeleteConfirmationModal,
  useDeleteConfirmation,
} from "~/components/delete-confirmation-modal"
import { routesConfig } from "~/config/routes-config"
import { canCreate, canDelete, canUpdate } from "~/utils/permissions"

import { type loader } from "./_loader"

export default function Route() {
  const loaderData = useLoaderData<typeof loader>()
  const { idForDeletion, isModalOpen, openModal, closeModal } =
    useDeleteConfirmation()

  const addArchivedIssuePath =
    routesConfig.administration.archive.addArchivedIssue.staticPath

  const permissions = loaderData.session.user.role.permissions
  const userId = loaderData.session.user.id

  const { canCreateOwn, canCreateAny } = canCreate(permissions)

  return (
    <>
      <h3>Archiv</h3>
      {(canCreateOwn || canCreateAny) && (
        <Link to={addArchivedIssuePath}>Přidat výtisk</Link>
      )}
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

            const authorId = issue.author.id

            const { canUpdateOwn, canUpdateAny } = canUpdate(
              permissions,
              userId,
              authorId
            )
            const { canDeleteOwn, canDeleteAny } = canDelete(
              permissions,
              userId,
              authorId
            )

            return (
              <tr key={issue.id}>
                <td>{issue.label}</td>
                <td>{issue.published ? "🟢" : "🔴"}</td>
                <td>
                  <Actions
                    canEdit={canUpdateAny || canUpdateOwn}
                    editPath={editArchivedIssuePath}
                    canDelete={canDeleteAny || canDeleteOwn}
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
