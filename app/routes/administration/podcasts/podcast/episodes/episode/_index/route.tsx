// noinspection JSUnusedGlobalSymbols

import { Activity, useRef } from 'react'
import { Form, href } from 'react-router'

import { AdminActionButton } from '~/components/admin/admin-action-button'
import { AdminActionGroup } from '~/components/admin/admin-action-group'
import {
  AdminDeleteConfirmationDialog,
  useAdminDeleteConfirmationDialog,
} from '~/components/admin/admin-delete-confirmation-dialog'
import { AdminDetailItem } from '~/components/admin/admin-detail-item'
import { AdminDetailList } from '~/components/admin/admin-detail-list'
import { AdminDetailSection } from '~/components/admin/admin-detail-section'
import { AdminHeadline } from '~/components/admin/admin-headline'
import { AdminLinkButton } from '~/components/admin/admin-link-button'
import { AdminPage } from '~/components/admin/admin-page'
import { AdminStateBadge } from '~/components/admin/admin-state-badge'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Hyperlink } from '~/components/hyperlink'
import { ArchiveIcon } from '~/components/icons/archive-icon'
import { ArrowUpwardIcon } from '~/components/icons/arrow-upward-icon'
import { CheckIcon } from '~/components/icons/check-icon'
import { DeleteIcon } from '~/components/icons/delete-icon'
import { EditIcon } from '~/components/icons/edit-icon'
import { RefreshIcon } from '~/components/icons/refresh-icon'
import { UndoIcon } from '~/components/icons/undo-icon'
import { getAuthorRoleLabel } from '~/utils/role-labels'

import type { Route } from './+types/route'

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({
  loaderData,
  params,
}: Route.ComponentProps) {
  const {
    episode,
    canUpdate,
    canDelete,
    canPublish,
    canRetract,
    canArchive,
    canRestore,
    canReview,
    hasReviewed,
    needsReview,
  } = loaderData
  const { podcastId, episodeId } = params

  const deleteConfirmationDialogRef = useRef<HTMLDialogElement>(null)

  const { openDialog } = useAdminDeleteConfirmationDialog(
    deleteConfirmationDialogRef,
    {
      action: href('/administration/podcasts/:podcastId/episodes/:episodeId', {
        episodeId,
        podcastId,
      }),
      withRedirect: true,
    },
  )

  return (
    <AdminPage>
      <AdminHeadline>{episode.title}</AdminHeadline>

      <AdminActionGroup>
        {canUpdate && (
          <AdminLinkButton
            to={href(
              '/administration/podcasts/:podcastId/episodes/:episodeId/edit-episode',
              {
                episodeId,
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
              disabled={needsReview}
              title={
                needsReview
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
          <AdminDetailItem label="Podcast">
            <Hyperlink
              href={href('/administration/podcasts/:podcastId', {
                podcastId,
              })}
            >
              {episode.podcast.title}
            </Hyperlink>
          </AdminDetailItem>
          <AdminDetailItem label="Číslo">{episode.number}</AdminDetailItem>
          <AdminDetailItem label="Název">{episode.title}</AdminDetailItem>
          <AdminDetailItem label="Slug">{episode.slug}</AdminDetailItem>
          <AdminDetailItem label="Stav">
            <AdminStateBadge state={episode.state} />
          </AdminDetailItem>
          {episode.description && (
            <AdminDetailItem label="Popis">
              {episode.description}
            </AdminDetailItem>
          )}
          {episode.publishedAt.iso && (
            <AdminDetailItem label="Datum publikování">
              {episode.publishedAt.formatted}
            </AdminDetailItem>
          )}
          <AdminDetailItem label="Autor">{episode.author.name}</AdminDetailItem>
        </AdminDetailList>
      </AdminDetailSection>

      <AdminDetailSection title="Soubory">
        <AdminDetailList>
          <AdminDetailItem label="Obálka">
            {episode.hasCover && episode.coverUrl ? (
              <Hyperlink href={episode.coverUrl}>Zobrazit obálku</Hyperlink>
            ) : (
              'Žádná obálka'
            )}
          </AdminDetailItem>
        </AdminDetailList>
      </AdminDetailSection>

      <AdminDetailSection title="Odkazy">
        <AdminDetailList>
          {episode.links.length > 0 ? (
            episode.links.map((link) => (
              <AdminDetailItem key={link.id} label={link.label}>
                <Hyperlink href={link.url}>{link.url}</Hyperlink>
              </AdminDetailItem>
            ))
          ) : (
            <AdminDetailItem label="Odkazy">Žádné odkazy</AdminDetailItem>
          )}
        </AdminDetailList>
      </AdminDetailSection>

      <AdminDetailSection title="Metadata">
        <AdminDetailList>
          <AdminDetailItem label="Vytvořeno">
            {episode.createdAt.formatted}
          </AdminDetailItem>
          <AdminDetailItem label="Aktualizováno">
            {episode.updatedAt.formatted}
          </AdminDetailItem>
        </AdminDetailList>
      </AdminDetailSection>

      <AdminDetailSection title="Schválení">
        <AdminDetailList>
          <Activity mode={episode.reviews.length > 0 ? 'visible' : 'hidden'}>
            {episode.reviews.map((review) => (
              <AdminDetailItem
                key={review.id}
                label={`${review.reviewer.name} (${getAuthorRoleLabel(review.reviewer.roleName)})`}
              >
                {review.createdAt.formatted}
              </AdminDetailItem>
            ))}
          </Activity>
          <AdminDetailItem label="Schváleno koordinátorem">
            {episode.hasApprovingReview ? 'Ano' : 'Ne'}
          </AdminDetailItem>
        </AdminDetailList>
      </AdminDetailSection>

      <AdminDeleteConfirmationDialog ref={deleteConfirmationDialogRef} />
    </AdminPage>
  )
}
