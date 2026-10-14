// noinspection JSUnusedGlobalSymbols

import { useRef, useState } from 'react'
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
import { AdminPage } from '~/components/admin/admin-page'
import { AdminSubmissionActions } from '~/components/admin/admin-submission-actions'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Button } from '~/components/button'
import { Hyperlink } from '~/components/hyperlink'
import { ArchiveIcon } from '~/components/icons/archive-icon'
import { ArrowUpwardIcon } from '~/components/icons/arrow-upward-icon'
import { CheckIcon } from '~/components/icons/check-icon'
import { DeleteIcon } from '~/components/icons/delete-icon'
import { EditIcon } from '~/components/icons/edit-icon'
import { RefreshIcon } from '~/components/icons/refresh-icon'
import { UndoIcon } from '~/components/icons/undo-icon'
import { LinkButton } from '~/components/link-button'
import { PageTitle } from '~/components/page-title'
import { StatusTag } from '~/components/status-tag'
import { useContentEvents } from '~/hooks/use-content-events'

import type { Route } from './+types/route'
import { PodcastHistoryDialog } from './components/podcast-history-dialog'

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({
  loaderData,
  params,
}: Route.ComponentProps) {
  const {
    podcast,
    canEdit,
    canDelete,
    canPublish,
    canRetract,
    canArchive,
    canRestore,
    canApprove,
    canSubmit,
    canWithdraw,
    canReturn,
    submission,
  } = loaderData
  const { podcastId } = params

  useContentEvents({
    filter: (event) =>
      event.entity === 'podcast' && event.entityId === podcastId,
  })

  const deleteConfirmationDialogRef = useRef<HTMLDialogElement>(null)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  const { openDialog } = useAdminDeleteConfirmationDialog(
    deleteConfirmationDialogRef,
    {
      action: href('/administration/podcasts/:podcastId', { podcastId }),
      withRedirect: true,
    },
  )

  return (
    <AdminPage>
      <PageTitle>{podcast.title}</PageTitle>

      <AdminActionGroup>
        {/* First in every state, until 27b's „⋯“ takes it over (27j). */}
        <Button
          onClick={() => setIsHistoryOpen(true)}
          type={'button'}
          variant={'outline'}
        >
          Historie
        </Button>
        <LinkButton
          to={href('/administration/podcasts/:podcastId/episodes', {
            podcastId,
          })}
          variant={'outline'}
        >
          Zobrazit epizody
        </LinkButton>
        {canEdit && (
          <LinkButton
            to={href('/administration/podcasts/:podcastId/edit-podcast', {
              podcastId,
            })}
            variant={'outline'}
          >
            <EditIcon />
            Upravit
          </LinkButton>
        )}
        <AdminSubmissionActions
          canReturn={canReturn}
          canSubmit={canSubmit}
          canWithdraw={canWithdraw}
          contentId={podcast.id}
        />
        {canApprove && (
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
            <AdminActionButton action="publish" type="submit">
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
          <AdminDetailItem label="Název">{podcast.title}</AdminDetailItem>
          <AdminDetailItem label="Stav">
            <StatusTag state={submission ?? podcast.state} />
          </AdminDetailItem>
          {podcast.description && (
            <AdminDetailItem label="Popis">
              {podcast.description}
            </AdminDetailItem>
          )}
          {podcast.publishedAt.iso && (
            <AdminDetailItem label="Datum publikování">
              {podcast.publishedAt.formatted}
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
              'Žádná obálka'
            )}
          </AdminDetailItem>
        </AdminDetailList>
      </AdminDetailSection>

      <AdminDeleteConfirmationDialog ref={deleteConfirmationDialogRef} />

      {isHistoryOpen && (
        <PodcastHistoryDialog
          history={podcast.history}
          onClose={() => setIsHistoryOpen(false)}
          podcastTitle={podcast.title}
        />
      )}
    </AdminPage>
  )
}
