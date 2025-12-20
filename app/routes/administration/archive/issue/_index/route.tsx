// noinspection JSUnusedGlobalSymbols

import { Activity, useRef } from "react"
import { href, useFetcher } from "react-router"

import { AdminActionButton } from "~/components/admin-action-button"
import { AdminActionGroup } from "~/components/admin-action-group"
import {
  AdminDeleteConfirmationDialog,
  useAdminDeleteConfirmationDialog,
} from "~/components/admin-delete-confirmation-dialog"
import { AdminDetailItem } from "~/components/admin-detail-item"
import { AdminDetailList } from "~/components/admin-detail-list"
import { AdminDetailSection } from "~/components/admin-detail-section"
import { AdminHeadline } from "~/components/admin-headline"
import { AdminLinkButton } from "~/components/admin-link-button"
import { AdminPage } from "~/components/admin-page"
import { AdminStateBadge } from "~/components/admin-state-badge"
import { AuthenticityTokenInput } from "~/components/authenticity-token-input"
import { Hyperlink } from "~/components/hyperlink"
import { ArchiveIcon } from "~/components/icons/archive-icon"
import { ArrowUpward } from "~/components/icons/arrow-upward"
import { CheckIcon } from "~/components/icons/check-icon"
import { DeleteIcon } from "~/components/icons/delete-icon"
import { EditIcon } from "~/components/icons/edit-icon"
import { RefreshIcon } from "~/components/icons/refresh-icon"
import { UndoIcon } from "~/components/icons/undo-icon"
import { FORM_CONFIG } from "~/config/form-config"

import type { Route } from "./+types/route"

const INTENT_NAME = FORM_CONFIG.intent.name
const INTENT_VALUE = FORM_CONFIG.intent.value

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

  const fetcherKey = `issue-action-${issueId}`
  const fetcher = useFetcher({ key: fetcherKey })
  const { Form } = fetcher

  const isSubmitting = fetcher.state !== "idle"

  const submittingIntent =
    fetcher.state !== "idle" && fetcher.formData
      ? fetcher.formData.get(INTENT_NAME)
      : null

  const deleteConfirmationDialogRef = useRef<HTMLDialogElement>(null)

  const { openDialog } = useAdminDeleteConfirmationDialog(
    deleteConfirmationDialogRef,
    {
      action: href("/administration/archive/:issueId", { issueId }),
      withRedirect: true,
      key: fetcherKey,
    }
  )

  return (
    <AdminPage>
      <AdminHeadline>{issue.label}</AdminHeadline>

      <AdminActionGroup>
        {canUpdate && (
          <AdminLinkButton
            to={href("/administration/archive/:issueId/edit-issue", {
              issueId,
            })}
            disabled={isSubmitting}
          >
            <EditIcon />
            Upravit
          </AdminLinkButton>
        )}
        {canReview && !hasReviewed && (
          <Form method="post">
            <AuthenticityTokenInput />
            <AdminActionButton
              type={"submit"}
              action={"review"}
              disabled={isSubmitting}
              name={INTENT_NAME}
              value={INTENT_VALUE.review}
            >
              <CheckIcon />
              {submittingIntent === INTENT_VALUE.review
                ? "Schvaluji..."
                : "Schválit"}
            </AdminActionButton>
          </Form>
        )}
        {canPublish && (
          <Form method="post">
            <AuthenticityTokenInput />
            <AdminActionButton
              type={"submit"}
              action={"publish"}
              disabled={needsCoordinatorReview || isSubmitting}
              title={
                needsCoordinatorReview
                  ? "Nelze publikovat bez schválení koordinátora"
                  : undefined
              }
              name={INTENT_NAME}
              value={INTENT_VALUE.publish}
            >
              <ArrowUpward />
              {submittingIntent === INTENT_VALUE.publish
                ? "Zveřejňuji..."
                : "Zveřejnit"}
            </AdminActionButton>
          </Form>
        )}
        {canRetract && (
          <Form method="post">
            <AuthenticityTokenInput />
            <AdminActionButton
              type={"submit"}
              action={"retract"}
              disabled={isSubmitting}
              name={INTENT_NAME}
              value={INTENT_VALUE.retract}
            >
              <UndoIcon />
              {submittingIntent === INTENT_VALUE.retract
                ? "Stahuji..."
                : "Stáhnout z publikace"}
            </AdminActionButton>
          </Form>
        )}
        {canArchive && (
          <Form method="post">
            <AuthenticityTokenInput />
            <AdminActionButton
              type={"submit"}
              action={"archive"}
              disabled={isSubmitting}
              name={INTENT_NAME}
              value={INTENT_VALUE.archive}
            >
              <ArchiveIcon />
              {submittingIntent === INTENT_VALUE.archive
                ? "Archivuji..."
                : "Archivovat"}
            </AdminActionButton>
          </Form>
        )}
        {canRestore && (
          <Form method="post">
            <AuthenticityTokenInput />
            <AdminActionButton
              type={"submit"}
              action={"restore"}
              disabled={isSubmitting}
              name={INTENT_NAME}
              value={INTENT_VALUE.restore}
            >
              <RefreshIcon />
              {submittingIntent === INTENT_VALUE.restore
                ? "Obnovuji..."
                : "Obnovit"}
            </AdminActionButton>
          </Form>
        )}
        {canDelete && (
          <AdminActionButton
            action="delete"
            onClick={openDialog}
            disabled={isSubmitting}
          >
            <DeleteIcon />
            {submittingIntent === INTENT_VALUE.delete ? "Mažu..." : "Smazat"}
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

      <AdminDeleteConfirmationDialog ref={deleteConfirmationDialogRef} />
    </AdminPage>
  )
}
