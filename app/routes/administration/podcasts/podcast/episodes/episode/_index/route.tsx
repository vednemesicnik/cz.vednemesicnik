// noinspection JSUnusedGlobalSymbols

import { Activity, useRef, useState } from 'react'
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
import { AdminHeadline } from '~/components/admin/admin-headline'
import { AdminLinkButton } from '~/components/admin/admin-link-button'
import { AdminPage } from '~/components/admin/admin-page'
import { AdminPublishDateDialog } from '~/components/admin/admin-publish-date-dialog'
import { AdminSplitButton } from '~/components/admin/admin-split-button'
import { AdminStateBadge } from '~/components/admin/admin-state-badge'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Hyperlink } from '~/components/hyperlink'
import { ArchiveIcon } from '~/components/icons/archive-icon'
import { ArrowUpwardIcon } from '~/components/icons/arrow-upward-icon'
import { CalendarIcon } from '~/components/icons/calendar-icon'
import { CheckIcon } from '~/components/icons/check-icon'
import { DeleteIcon } from '~/components/icons/delete-icon'
import { EditIcon } from '~/components/icons/edit-icon'
import { RefreshIcon } from '~/components/icons/refresh-icon'
import { UndoIcon } from '~/components/icons/undo-icon'
import { FORM_CONFIG } from '~/config/form-config'
import { getAuthorRoleLabel } from '~/utils/role-labels'

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
    canUpdate,
    canDelete,
    canPublish,
    canPublishBackdated,
    canChangePublishedAt,
    canRetract,
    canArchive,
    canRestore,
    canReview,
    hasReviewed,
    needsReview,
  } = loaderData
  const { podcastId, episodeId } = params

  // Selected mode of the draft publish split button (Coordinators only).
  const [publishMode, setPublishMode] = useState<PublishMode>('publish')

  const fetcherKey = `episode-action-${episodeId}`
  const fetcher = useFetcher({ key: fetcherKey })
  const { Form } = fetcher

  const isSubmitting = fetcher.state !== 'idle'

  const submittingIntent =
    fetcher.state !== 'idle' && fetcher.formData
      ? fetcher.formData.get(INTENT_NAME)
      : null

  const publishDisabledTitle = needsReview
    ? 'Nelze publikovat bez schválení koordinátora'
    : undefined

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
    <AdminPage>
      <AdminHeadline>{episode.title}</AdminHeadline>

      <AdminActionGroup>
        {canUpdate && (
          <AdminLinkButton
            disabled={isSubmitting}
            to={href(
              '/administration/podcasts/:podcastId/episodes/:episodeId/edit-episode',
              { episodeId, podcastId },
            )}
          >
            <EditIcon />
            Upravit
          </AdminLinkButton>
        )}
        {canReview && !hasReviewed && (
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
                    disabled={needsReview || isSubmitting}
                    name={INTENT_NAME}
                    title={publishDisabledTitle}
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
                    disabled={needsReview || isSubmitting}
                    onClick={() =>
                      backdatedPublishDialogRef.current?.showModal()
                    }
                    title={publishDisabledTitle}
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
                disabled={needsReview || isSubmitting}
                name={INTENT_NAME}
                title={publishDisabledTitle}
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
