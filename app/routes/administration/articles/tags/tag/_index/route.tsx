// noinspection JSUnusedGlobalSymbols

import { Activity, useRef } from 'react'
import { href, useFetcher } from 'react-router'

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
import { ArchiveIcon } from '~/components/icons/archive-icon'
import { ArrowUpwardIcon } from '~/components/icons/arrow-upward-icon'
import { CheckIcon } from '~/components/icons/check-icon'
import { DeleteIcon } from '~/components/icons/delete-icon'
import { EditIcon } from '~/components/icons/edit-icon'
import { RefreshIcon } from '~/components/icons/refresh-icon'
import { UndoIcon } from '~/components/icons/undo-icon'
import { FORM_CONFIG } from '~/config/form-config'

import type { Route } from './+types/route'

const INTENT_NAME = FORM_CONFIG.intent.name
const INTENT_VALUE = FORM_CONFIG.intent.value

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({
  loaderData,
  params,
}: Route.ComponentProps) {
  const {
    tag,
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
  const { tagId } = params

  const fetcherKey = `category-action-${tagId}`
  const fetcher = useFetcher({ key: fetcherKey })
  const { Form } = fetcher

  const isSubmitting = fetcher.state !== 'idle'

  const submittingIntent =
    fetcher.state !== 'idle' && fetcher.formData
      ? fetcher.formData.get(INTENT_NAME)
      : null

  const deleteConfirmationDialogRef = useRef<HTMLDialogElement>(null)

  const { openDialog } = useAdminDeleteConfirmationDialog(
    deleteConfirmationDialogRef,
    {
      action: href('/administration/articles/tags/:tagId', {
        tagId,
      }),
      key: fetcherKey,
      withRedirect: true,
    },
  )

  return (
    <AdminPage>
      <AdminHeadline>{tag.name}</AdminHeadline>

      <AdminActionGroup>
        {canUpdate && (
          <AdminLinkButton
            disabled={isSubmitting}
            to={href('/administration/articles/tags/:tagId/edit-tag', {
              tagId,
            })}
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
        {canPublish && (
          <Form method="post">
            <AuthenticityTokenInput />
            <AdminActionButton
              action={'publish'}
              disabled={needsCoordinatorReview || isSubmitting}
              name={INTENT_NAME}
              title={
                needsCoordinatorReview
                  ? 'Nelze publikovat bez schválení koordinátora'
                  : undefined
              }
              type={'submit'}
              value={INTENT_VALUE.publish}
            >
              <ArrowUpwardIcon />
              {submittingIntent === INTENT_VALUE.publish
                ? 'Zveřejňuje se...'
                : 'Zveřejnit'}
            </AdminActionButton>
          </Form>
        )}
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
          <AdminDetailItem label="Název">{tag.name}</AdminDetailItem>
          <AdminDetailItem label="Slug">{tag.slug}</AdminDetailItem>
          <AdminDetailItem label="Stav">
            <AdminStateBadge state={tag.state} />
          </AdminDetailItem>
        </AdminDetailList>
      </AdminDetailSection>

      <AdminDetailSection title="Metadata">
        <AdminDetailList>
          <AdminDetailItem label="Vytvořeno">{tag.createdAt}</AdminDetailItem>
          <AdminDetailItem label="Aktualizováno">
            {tag.updatedAt}
          </AdminDetailItem>
          {tag.publishedAt && (
            <AdminDetailItem label="Publikováno">
              {tag.publishedAt}
            </AdminDetailItem>
          )}
          <AdminDetailItem label="Autor">{tag.author.name}</AdminDetailItem>
        </AdminDetailList>
      </AdminDetailSection>

      <AdminDetailSection title="Schválení">
        <AdminDetailList>
          <Activity mode={tag.reviews.length > 0 ? 'visible' : 'hidden'}>
            {tag.reviews.map((review) => (
              <AdminDetailItem
                key={review.id}
                label={`${review.reviewer.name} (${review.reviewer.roleName})`}
              >
                {review.createdAt}
              </AdminDetailItem>
            ))}
          </Activity>
          <AdminDetailItem label="Schváleno koordinátorem">
            {tag.hasCoordinatorReview ? 'Ano' : 'Ne'}
          </AdminDetailItem>
        </AdminDetailList>
      </AdminDetailSection>

      <AdminDeleteConfirmationDialog ref={deleteConfirmationDialogRef} />
    </AdminPage>
  )
}
