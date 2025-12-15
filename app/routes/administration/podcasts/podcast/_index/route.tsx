// noinspection JSUnusedGlobalSymbols

import { Activity, useRef } from "react"
import { Form, href } from "react-router"

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

import type { Route } from "./+types/route"

export { action } from "./_action"
export { loader } from "./_loader"
export { meta } from "./_meta"

export default function RouteComponent({
  loaderData,
  params,
}: Route.ComponentProps) {
  const {
    podcast,
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
  const { podcastId } = params

  const deleteConfirmationDialogRef = useRef<HTMLDialogElement>(null)

  const { openDialog } = useAdminDeleteConfirmationDialog(
    deleteConfirmationDialogRef,
    {
      action: href("/administration/podcasts/:podcastId", { podcastId }),
      withRedirect: true,
    }
  )

  return (
    <AdminPage>
      <AdminHeadline>{podcast.title}</AdminHeadline>

      <AdminActionGroup>
        <AdminLinkButton
          to={href("/administration/podcasts/:podcastId/episodes", {
            podcastId,
          })}
        >
          Zobrazit epizody
        </AdminLinkButton>
        {canUpdate && (
          <AdminLinkButton
            to={href("/administration/podcasts/:podcastId/edit-podcast", {
              podcastId,
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
          <AdminActionButton action="delete" onClick={openDialog}>
            <DeleteIcon />
            Smazat
          </AdminActionButton>
        )}
      </AdminActionGroup>

      <AdminDetailSection title="Základní informace">
        <AdminDetailList>
          <AdminDetailItem label="Název">{podcast.title}</AdminDetailItem>
          <AdminDetailItem label="Stav">
            <AdminStateBadge state={podcast.state} />
          </AdminDetailItem>
          {podcast.description && (
            <AdminDetailItem label="Popis">
              {podcast.description}
            </AdminDetailItem>
          )}
          {podcast.publishedAt && (
            <AdminDetailItem label="Datum publikování">
              {podcast.publishedAt}
            </AdminDetailItem>
          )}
          <AdminDetailItem label="Autor">{podcast.author.name}</AdminDetailItem>
        </AdminDetailList>
      </AdminDetailSection>

      <AdminDetailSection title="Soubory">
        <AdminDetailList>
          <AdminDetailItem label="Obálka">
            {podcast.hasCover && podcast.coverUrl ? (
              <Hyperlink href={podcast.coverUrl}>Zobrazit obálku</Hyperlink>
            ) : (
              "Žádná obálka"
            )}
          </AdminDetailItem>
        </AdminDetailList>
      </AdminDetailSection>

      <AdminDetailSection title="Metadata">
        <AdminDetailList>
          <AdminDetailItem label="Vytvořeno">
            {podcast.createdAt}
          </AdminDetailItem>
          <AdminDetailItem label="Aktualizováno">
            {podcast.updatedAt}
          </AdminDetailItem>
        </AdminDetailList>
      </AdminDetailSection>

      <AdminDetailSection title="Schválení">
        <AdminDetailList>
          <Activity mode={podcast.reviews.length > 0 ? "visible" : "hidden"}>
            {podcast.reviews.map((review) => (
              <AdminDetailItem
                key={review.id}
                label={`${review.reviewer.name} (${review.reviewer.roleName === "coordinator" ? "Koordinátor" : "Tvůrce"})`}
              >
                {review.createdAt}
              </AdminDetailItem>
            ))}
          </Activity>
          <AdminDetailItem label="Schváleno koordinátorem">
            {podcast.hasCoordinatorReview ? "Ano" : "Ne"}
          </AdminDetailItem>
        </AdminDetailList>
      </AdminDetailSection>

      <AdminDeleteConfirmationDialog ref={deleteConfirmationDialogRef} />
    </AdminPage>
  )
}
