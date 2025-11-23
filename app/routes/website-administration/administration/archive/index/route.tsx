// noinspection JSUnusedGlobalSymbols

import { Link } from "react-router"

import { Actions } from "~/components/actions"
import {
  DeleteConfirmationModal,
  useDeleteConfirmation,
} from "~/components/delete-confirmation-modal"
import { Headline } from "~/components/headline"
import { routesConfig } from "~/config/routes-config"

import type { Route } from "./+types/route"
import { getCreateRights } from "./utils/get-create-rights"
import { getUpdateAndDeleteRights } from "./utils/get-update-and-delete-rights"

export default function Route({ loaderData }: Route.ComponentProps) {
  const { idForDeletion, isModalOpen, openModal, closeModal } =
    useDeleteConfirmation()

  const addIssuePath =
    routesConfig.administration.archive.addArchivedIssue.getPath()

  const { user } = loaderData.session

  const {
    hasCreateOwnDraftRight,
    hasCreateOwnPublishedRight,
    hasCreateAnyDraftRight,
    hasCreateAnyPublishedRight,
  } = getCreateRights({ permissions: user.author.role.permissions })

  const hasCreateRight =
    hasCreateOwnDraftRight ||
    hasCreateOwnPublishedRight ||
    hasCreateAnyDraftRight ||
    hasCreateAnyPublishedRight

  console.log({ authorRolePermissions: user.author.role.permissions })

  return (
    <>
      <Headline>Archiv</Headline>
      {hasCreateRight && <Link to={addIssuePath}>Přidat číslo</Link>}
      <hr />
      <table>
        <thead>
          <tr>
            <th>Název</th>
            <th>Stav</th>
            <th>Akce</th>
          </tr>
        </thead>
        <tbody>
          {loaderData.issues.map((issue) => {
            const editArchivedIssuePath =
              routesConfig.administration.archive.editArchivedIssue.getPath(
                issue.id
              )

            const {
              hasUpdateOwnRight,
              hasUpdateAnyRight,
              hasDeleteOwnRight,
              hasDeleteAnyRight,
            } = getUpdateAndDeleteRights({
              userAuthorPermissions: user.author.role.permissions,
              userAuthorId: user.author.id,
              issueState: issue.state,
              issueAuthorId: issue.authorId,
            })

            const hasUpdateRight = hasUpdateOwnRight || hasUpdateAnyRight
            const hasDeleteRight = hasDeleteOwnRight || hasDeleteAnyRight

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
