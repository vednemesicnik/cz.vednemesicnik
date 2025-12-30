// noinspection JSUnusedGlobalSymbols
import { Activity, useRef } from 'react'
import { Form, href } from 'react-router'
import { AdminActionButton } from '~/components/admin-action-button'
import { AdminActionGroup } from '~/components/admin-action-group'
import {
  AdminDeleteConfirmationDialog,
  useAdminDeleteConfirmationDialog,
} from '~/components/admin-delete-confirmation-dialog'
import { AdminDetailItem } from '~/components/admin-detail-item'
import { AdminDetailList } from '~/components/admin-detail-list'
import { AdminDetailSection } from '~/components/admin-detail-section'
import { AdminHeadline } from '~/components/admin-headline'
import { AdminLinkButton } from '~/components/admin-link-button'
import { AdminPage } from '~/components/admin-page'
import { AdminStateBadge } from '~/components/admin-state-badge'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Hyperlink } from '~/components/hyperlink'
import { ArchiveIcon } from '~/components/icons/archive-icon'
import { ArrowUpwardIcon } from '~/components/icons/arrow-upward-icon'
import { CheckIcon } from '~/components/icons/check-icon'
import { DeleteIcon } from '~/components/icons/delete-icon'
import { EditIcon } from '~/components/icons/edit-icon'
import { RefreshIcon } from '~/components/icons/refresh-icon'
import { UndoIcon } from '~/components/icons/undo-icon'
import type { Route } from './+types/route'

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({
  loaderData,
  params,
}: Route.ComponentProps) {
  const {
    link,
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
  const { podcastId, episodeId, linkId } = params

  const deleteConfirmationDialogRef = useRef<HTMLDialogElement>(null)

  const { openDialog } = useAdminDeleteConfirmationDialog(
    deleteConfirmationDialogRef,
    {
      action: href(
        '/administration/podcasts/:podcastId/episodes/:episodeId/links/:linkId',
        { episodeId, linkId, podcastId },
      ),
      withRedirect: true,
    },
  )

  return (
    <AdminPage>
      <AdminHeadline>{link.label}</AdminHeadline>

      <AdminActionGroup>
        {canUpdate && (
          <AdminLinkButton
            to={href(
              '/administration/podcasts/:podcastId/episodes/:episodeId/links/:linkId/edit-link',
              {
                episodeId,
                linkId,
                podcastId,
              },
            )}
          >
            <EditIcon />
            Upravit
          </AdminLinkButton>
        )}
        {canReview && !hasReviewed && (
          <Form method="post">
            <AuthenticityTokenInput />
            <input name="intent" type="hidden" value="review" />
            <AdminActionButton action="review" type="submit">
              <CheckIcon />
              Schválit
            </AdminActionButton>
          </Form>
        )}
        {canPublish && (
          <Form method="post">
            <AuthenticityTokenInput />
            <input name="intent" type="hidden" value="publish" />
            <AdminActionButton
              action="publish"
              disabled={needsCoordinatorReview}
              title={
                needsCoordinatorReview
                  ? 'Nelze publikovat bez schválení koordinátora'
                  : undefined
              }
              type="submit"
            >
              <ArrowUpwardIcon />
              Zveřejnit
            </AdminActionButton>
          </Form>
        )}
        {canRetract && (
          <Form method="post">
            <AuthenticityTokenInput />
            <input name="intent" type="hidden" value="retract" />
            <AdminActionButton action="retract" type="submit">
              <UndoIcon />
              Stáhnout z publikace
            </AdminActionButton>
          </Form>
        )}
        {canArchive && (
          <Form method="post">
            <AuthenticityTokenInput />
            <input name="intent" type="hidden" value="archive" />
            <AdminActionButton action="archive" type="submit">
              <ArchiveIcon />
              Archivovat
            </AdminActionButton>
          </Form>
        )}
        {canRestore && (
          <Form method="post">
            <AuthenticityTokenInput />
            <input name="intent" type="hidden" value="restore" />
            <AdminActionButton action="restore" type="submit">
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
          <AdminDetailItem label="Štítek">{link.label}</AdminDetailItem>
          <AdminDetailItem label="URL">
            <Hyperlink href={link.url}>{link.url}</Hyperlink>
          </AdminDetailItem>
          <AdminDetailItem label="Stav">
            <AdminStateBadge state={link.state} />
          </AdminDetailItem>
          {link.publishedAt && (
            <AdminDetailItem label="Datum publikování">
              {link.publishedAt}
            </AdminDetailItem>
          )}
          <AdminDetailItem label="Autor">{link.author.name}</AdminDetailItem>
        </AdminDetailList>
      </AdminDetailSection>

      <AdminDetailSection title="Metadata">
        <AdminDetailList>
          <AdminDetailItem label="Vytvořeno">{link.createdAt}</AdminDetailItem>
          <AdminDetailItem label="Aktualizováno">
            {link.updatedAt}
          </AdminDetailItem>
        </AdminDetailList>
      </AdminDetailSection>

      <AdminDetailSection title="Schválení">
        <AdminDetailList>
          <Activity mode={link.reviews.length > 0 ? 'visible' : 'hidden'}>
            {link.reviews.map((review) => (
              <AdminDetailItem
                key={review.id}
                label={`${review.reviewer.name} (${review.reviewer.role.name === 'coordinator' ? 'Koordinátor' : 'Tvůrce'})`}
              >
                {review.createdAt}
              </AdminDetailItem>
            ))}
          </Activity>
          <AdminDetailItem label="Schváleno koordinátorem">
            {link.reviews.some(
              (review) => review.reviewer.role.name === 'coordinator',
            )
              ? 'Ano'
              : 'Ne'}
          </AdminDetailItem>
        </AdminDetailList>
      </AdminDetailSection>

      <AdminDeleteConfirmationDialog ref={deleteConfirmationDialogRef} />
    </AdminPage>
  )
}
