// noinspection JSUnusedGlobalSymbols

import { useRef, useState } from 'react'
import { href, useFetcher } from 'react-router'

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
import { AdminPublishDateDialog } from '~/components/admin/admin-publish-date-dialog'
import { AdminSplitButton } from '~/components/admin/admin-split-button'
import { AdminSubmissionActions } from '~/components/admin/admin-submission-actions'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { HistoryList } from '~/components/history-list'
import { Hyperlink } from '~/components/hyperlink'
import { ArchiveIcon } from '~/components/icons/archive-icon'
import { ArrowUpwardIcon } from '~/components/icons/arrow-upward-icon'
import { CalendarIcon } from '~/components/icons/calendar-icon'
import { CheckIcon } from '~/components/icons/check-icon'
import { DeleteIcon } from '~/components/icons/delete-icon'
import { EditIcon } from '~/components/icons/edit-icon'
import { RefreshIcon } from '~/components/icons/refresh-icon'
import { UndoIcon } from '~/components/icons/undo-icon'
import { LinkButton } from '~/components/link-button'
import { PageTitle } from '~/components/page-title'
import { StatusTag } from '~/components/status-tag'
import { FORM_CONFIG } from '~/config/form-config'
import { useContentActionResult } from '~/hooks/use-content-action-result'
import { useContentEvents } from '~/hooks/use-content-events'

import { EpisodeMissingDialog } from '../../components/episode-missing-dialog'
import type { Route } from './+types/route'

const INTENT_NAME = FORM_CONFIG.intent.name
const INTENT_VALUE = FORM_CONFIG.intent.value

const PUBLISH_MODES = ['publish', 'publish-backdated'] as const
type PublishMode = (typeof PUBLISH_MODES)[number]

const isPublishMode = (id: string): id is PublishMode =>
  (PUBLISH_MODES as readonly string[]).includes(id)

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({
  loaderData,
  params,
}: Route.ComponentProps) {
  const {
    episode,
    canEdit,
    canDelete,
    canPublish,
    canPublishBackdated,
    canChangePublishedAt,
    canRetract,
    canArchive,
    canRestore,
    canApprove,
    canSubmit,
    canWithdraw,
    canReturn,
    submission,
  } = loaderData
  const { podcastId, episodeId } = params

  useContentEvents({
    filter: (event) =>
      event.entity === 'podcast_episode' && event.entityId === episodeId,
  })

  // Selected mode of the draft publish split button (Coordinators only).
  const [publishMode, setPublishMode] = useState<PublishMode>('publish')

  const fetcherKey = `episode-action-${episodeId}`
  const fetcher = useFetcher({ key: fetcherKey })
  const { Form } = fetcher

  const isSubmitting = fetcher.state !== 'idle'
  const { closeMissingList, missingList } = useContentActionResult(fetcher.data)

  const submittingIntent =
    fetcher.state !== 'idle' && fetcher.formData
      ? fetcher.formData.get(INTENT_NAME)
      : null

  const actionUrl = href(
    '/administration/podcasts/:podcastId/episodes/:episodeId',
    { episodeId, podcastId },
  )

  const deleteConfirmationDialogRef = useRef<HTMLDialogElement>(null)
  const backdatedPublishDialogRef = useRef<HTMLDialogElement>(null)
  const changePublishedAtDialogRef = useRef<HTMLDialogElement>(null)

  const { openDialog } = useAdminDeleteConfirmationDialog(
    deleteConfirmationDialogRef,
    {
      action: actionUrl,
      key: fetcherKey,
      withRedirect: true,
    },
  )

  return (
    <AdminPage measure={'text'}>
      <PageTitle>{episode.title}</PageTitle>

      <AdminActionGroup>
        {canEdit && (
          <LinkButton
            disabled={isSubmitting}
            to={href(
              '/administration/podcasts/:podcastId/episodes/:episodeId/edit-episode',
              { episodeId, podcastId },
            )}
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
          fetcherKey={fetcherKey}
        />
        {canApprove && (
          <Form method="post">
            <AuthenticityTokenInput />
            <AdminActionButton
              action={'review'}
              disabled={isSubmitting}
              name={INTENT_NAME}
              type={'submit'}
              value={INTENT_VALUE.review}
            >
              <CheckIcon />
              {submittingIntent === INTENT_VALUE.review
                ? 'Schvaluje se...'
                : 'Schválit'}
            </AdminActionButton>
          </Form>
        )}
        {canPublish &&
          (canPublishBackdated ? (
            <Form method="post">
              <AuthenticityTokenInput />
              <AdminSplitButton
                action={'publish'}
                disabled={isSubmitting}
                onSelect={(id) => {
                  if (isPublishMode(id)) setPublishMode(id)
                }}
                options={[
                  { id: 'publish', label: 'Zveřejnit' },
                  { id: 'publish-backdated', label: 'Zveřejnit zpětně' },
                ]}
                selectedId={publishMode}
              >
                {publishMode === 'publish' ? (
                  <AdminActionButton
                    action={'publish'}
                    disabled={isSubmitting}
                    name={INTENT_NAME}
                    type={'submit'}
                    value={INTENT_VALUE.publish}
                  >
                    <ArrowUpwardIcon />
                    {submittingIntent === INTENT_VALUE.publish
                      ? 'Zveřejňuje se...'
                      : 'Zveřejnit'}
                  </AdminActionButton>
                ) : (
                  <AdminActionButton
                    action={'publish'}
                    disabled={isSubmitting}
                    onClick={() =>
                      backdatedPublishDialogRef.current?.showModal()
                    }
                    type={'button'}
                  >
                    <ArrowUpwardIcon />
                    Zveřejnit zpětně
                  </AdminActionButton>
                )}
              </AdminSplitButton>
            </Form>
          ) : (
            <Form method="post">
              <AuthenticityTokenInput />
              <AdminActionButton
                action={'publish'}
                disabled={isSubmitting}
                name={INTENT_NAME}
                type={'submit'}
                value={INTENT_VALUE.publish}
              >
                <ArrowUpwardIcon />
                {submittingIntent === INTENT_VALUE.publish
                  ? 'Zveřejňuje se...'
                  : 'Zveřejnit'}
              </AdminActionButton>
            </Form>
          ))}
        {canRetract && (
          <Form method="post">
            <AuthenticityTokenInput />
            <AdminActionButton
              action={'retract'}
              disabled={isSubmitting}
              name={INTENT_NAME}
              type={'submit'}
              value={INTENT_VALUE.retract}
            >
              <UndoIcon />
              {submittingIntent === INTENT_VALUE.retract
                ? 'Stahuje se...'
                : 'Stáhnout z publikace'}
            </AdminActionButton>
          </Form>
        )}
        {canChangePublishedAt && (
          <AdminActionButton
            action={'publish'}
            disabled={isSubmitting}
            onClick={() => changePublishedAtDialogRef.current?.showModal()}
            type={'button'}
          >
            <CalendarIcon />
            Změnit datum vydání
          </AdminActionButton>
        )}
        {canArchive && (
          <Form method="post">
            <AuthenticityTokenInput />
            <AdminActionButton
              action={'archive'}
              disabled={isSubmitting}
              name={INTENT_NAME}
              type={'submit'}
              value={INTENT_VALUE.archive}
            >
              <ArchiveIcon />
              {submittingIntent === INTENT_VALUE.archive
                ? 'Archivuje se...'
                : 'Archivovat'}
            </AdminActionButton>
          </Form>
        )}
        {canRestore && (
          <Form method="post">
            <AuthenticityTokenInput />
            <AdminActionButton
              action={'restore'}
              disabled={isSubmitting}
              name={INTENT_NAME}
              type={'submit'}
              value={INTENT_VALUE.restore}
            >
              <RefreshIcon />
              {submittingIntent === INTENT_VALUE.restore
                ? 'Obnovuje se...'
                : 'Obnovit'}
            </AdminActionButton>
          </Form>
        )}
        {canDelete && (
          <AdminActionButton
            action="delete"
            disabled={isSubmitting}
            onClick={openDialog}
          >
            <DeleteIcon />
            {submittingIntent === INTENT_VALUE.delete ? 'Maže se...' : 'Smazat'}
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
            <StatusTag state={submission ?? episode.state} />
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

      <AdminDetailSection title="Historie">
        <HistoryList
          entries={episode.history.entries}
          isIncomplete={episode.history.isIncomplete}
          // A reused route component starts every record collapsed.
          key={episode.id}
          visibleCount={5}
        />
      </AdminDetailSection>

      <AdminDeleteConfirmationDialog ref={deleteConfirmationDialogRef} />

      {missingList !== null && (
        <EpisodeMissingDialog
          editHref={href(
            '/administration/podcasts/:podcastId/episodes/:episodeId/edit-episode',
            { episodeId, podcastId },
          )}
          missingList={missingList}
          onClose={closeMissingList}
        />
      )}

      <AdminPublishDateDialog
        action={actionUrl}
        confirmLabel={'Zveřejnit'}
        description={
          'Epizoda bude publikována se zvoleným datem v minulosti a zařadí se tak na odpovídající místo ve výpisu epizod.'
        }
        fetcherKey={fetcherKey}
        intent={INTENT_VALUE.publish}
        ref={backdatedPublishDialogRef}
        title={'Zveřejnit zpětně'}
      />

      <AdminPublishDateDialog
        action={actionUrl}
        confirmLabel={'Změnit datum'}
        defaultPublishedAt={episode.publishedAt.iso ?? undefined}
        description={
          'Skutečně si přejete změnit datum vydání? Epizoda se přeřadí ve výpisu. Akce je určena k opravě chyb.'
        }
        fetcherKey={fetcherKey}
        intent={INTENT_VALUE.changePublishedAt}
        ref={changePublishedAtDialogRef}
        title={'Změnit datum vydání'}
      />
    </AdminPage>
  )
}
