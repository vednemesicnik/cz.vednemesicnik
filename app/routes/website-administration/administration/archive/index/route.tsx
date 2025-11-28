// noinspection JSUnusedGlobalSymbols

import { Link } from "react-router"

import { Actions } from "~/components/actions"
import {
  AdminTable,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "~/components/admin-table"
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
      <AdminTable>
        <TableHeader>
          <TableHeaderCell>Název</TableHeaderCell>
          <TableHeaderCell>Stav</TableHeaderCell>
          <TableHeaderCell>Akce</TableHeaderCell>
        </TableHeader>
        <TableBody>
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
              <TableRow key={issue.id}>
                <TableCell>{issue.label}</TableCell>
                <TableCell>{issue.state}</TableCell>
                <TableCell>
                  <Actions
                    canEdit={hasUpdateRight}
                    editPath={editArchivedIssuePath}
                    canDelete={hasDeleteRight}
                    onDelete={openModal(issue.id)}
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </AdminTable>
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
