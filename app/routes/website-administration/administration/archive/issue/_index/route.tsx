// noinspection JSUnusedGlobalSymbols

import { Activity } from "react"
import { Form, href } from "react-router"

import { AdminActionButton } from "~/components/admin-action-button"
import { AdminActionGroup } from "~/components/admin-action-group"
import {
  DeleteConfirmationModal,
  useDeleteConfirmation,
} from "~/components/admin-delete-confirmation-modal"
import { AdminDetailItem } from "~/components/admin-detail-item"
import { AdminDetailList } from "~/components/admin-detail-list"
import { AdminDetailSection } from "~/components/admin-detail-section"
import { AdminHeadline } from "~/components/admin-headline"
import { AdminLinkButton } from "~/components/admin-link-button"
import { AdminStateBadge } from "~/components/admin-state-badge"
import { AdministrationPage } from "~/components/administration-page"
import { AuthenticityTokenInput } from "~/components/authenticity-token-input"
import { Hyperlink } from "~/components/hyperlink"
import { ArchiveIcon } from "~/components/icons/archive-icon"
import { ArrowUpward } from "~/components/icons/arrow-upward"
import { CheckIcon } from "~/components/icons/check-icon"
import { DeleteIcon } from "~/components/icons/delete-icon"
import { EditIcon } from "~/components/icons/edit-icon"
import { RefreshIcon } from "~/components/icons/refresh-icon"
import { UndoIcon } from "~/components/icons/undo-icon"

import type { Route } from "./+types/route"

export { action } from "./_action"
export { loader } from "./_loader"
export { meta } from "./_meta"

export default function RouteComponent({
  loaderData,
  params,
}: Route.ComponentProps) {
  const {
    issue,
    canUpdate,
    canDelete,
    canPublish,
    canRetract,
    canArchive,
    canRestore,
    canReview,
    hasReviewed,
    needsCoordinatorReview,
  } = loaderData
  const { issueId } = params

  const { idForDeletion, isModalOpen, openModal, closeModal } =
    useDeleteConfirmation()

  return (
    <AdministrationPage>
      <AdminHeadline>{issue.label}</AdminHeadline>

      <AdminActionGroup>
        {canUpdate && (
          <AdminLinkButton
            to={href("/administration/archive/:issueId/edit-issue", {
              issueId,
            })}
          >
            <EditIcon />
            Upravit
          </AdminLinkButton>
        )}
        {canReview && !hasReviewed && (
          <Form method="post">
            <AuthenticityTokenInput />
            <input type="hidden" name="intent" value="review" />
            <AdminActionButton type="submit" action="review">
              <CheckIcon />
              Schválit
            </AdminActionButton>
          </Form>
        )}
        {canPublish && (
          <Form method="post">
            <AuthenticityTokenInput />
            <input type="hidden" name="intent" value="publish" />
            <AdminActionButton
              type="submit"
              action="publish"
              disabled={needsCoordinatorReview}
              title={
                needsCoordinatorReview
                  ? "Nelze publikovat bez schválení koordinátora"
                  : undefined
              }
            >
              <ArrowUpward />
              Zveřejnit
            </AdminActionButton>
          </Form>
        )}
        {canRetract && (
          <Form method="post">
            <AuthenticityTokenInput />
            <input type="hidden" name="intent" value="retract" />
            <AdminActionButton type="submit" action="retract">
              <UndoIcon />
              Stáhnout z publikace
            </AdminActionButton>
          </Form>
        )}
        {canArchive && (
          <Form method="post">
            <AuthenticityTokenInput />
            <input type="hidden" name="intent" value="archive" />
            <AdminActionButton type="submit" action="archive">
              <ArchiveIcon />
              Archivovat
            </AdminActionButton>
          </Form>
        )}
        {canRestore && (
          <Form method="post">
            <AuthenticityTokenInput />
            <input type="hidden" name="intent" value="restore" />
            <AdminActionButton type="submit" action="restore">
              <RefreshIcon />
              Obnovit
            </AdminActionButton>
          </Form>
        )}
        {canDelete && (
          <AdminActionButton action="delete" onClick={openModal(issueId)}>
            <DeleteIcon />
            Smazat
          </AdminActionButton>
        )}
      </AdminActionGroup>

      <AdminDetailSection title="Základní informace">
        <AdminDetailList>
          <AdminDetailItem label="Název">{issue.label}</AdminDetailItem>
          <AdminDetailItem label="Stav">
            <AdminStateBadge state={issue.state} />
          </AdminDetailItem>
          <AdminDetailItem label="Datum vydání">
            {issue.releasedAt}
          </AdminDetailItem>
          {issue.publishedAt && (
            <AdminDetailItem label="Datum publikování">
              {issue.publishedAt}
            </AdminDetailItem>
          )}
          <AdminDetailItem label="Autor">{issue.author.name}</AdminDetailItem>
        </AdminDetailList>
      </AdminDetailSection>

      <AdminDetailSection title="Soubory">
        <AdminDetailList>
          <AdminDetailItem label="Obálka">
            {issue.hasCover && issue.coverUrl ? (
              <Hyperlink href={issue.coverUrl}>Zobrazit obálku</Hyperlink>
            ) : (
              "Žádná obálka"
            )}
          </AdminDetailItem>
          <AdminDetailItem label="PDF">
            {issue.pdfUrl ? (
              <Hyperlink href={issue.pdfUrl}>Zobrazit PDF</Hyperlink>
            ) : (
              "Žádné PDF"
            )}
          </AdminDetailItem>
        </AdminDetailList>
      </AdminDetailSection>

      <AdminDetailSection title="Metadata">
        <AdminDetailList>
          <AdminDetailItem label="Vytvořeno">{issue.createdAt}</AdminDetailItem>
          <AdminDetailItem label="Aktualizováno">
            {issue.updatedAt}
          </AdminDetailItem>
        </AdminDetailList>
      </AdminDetailSection>

      <AdminDetailSection title="Schválení">
        <AdminDetailList>
          <Activity mode={issue.reviews.length > 0 ? "visible" : "hidden"}>
            {issue.reviews.map((review) => (
              <AdminDetailItem
                key={review.id}
                label={`${review.reviewer.name} (${review.reviewer.roleName === "coordinator" ? "Koordinátor" : "Tvůrce"})`}
              >
                {review.createdAt}
              </AdminDetailItem>
            ))}
          </Activity>
          <AdminDetailItem label="Schváleno koordinátorem">
            {issue.hasCoordinatorReview ? "Ano" : "Ne"}
          </AdminDetailItem>
        </AdminDetailList>
      </AdminDetailSection>

      <DeleteConfirmationModal
        id={idForDeletion}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </AdministrationPage>
  )
}
