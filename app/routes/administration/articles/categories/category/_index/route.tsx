// noinspection JSUnusedGlobalSymbols

import { useRef } from 'react'
import { href, Outlet, useFetcher } from 'react-router'

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
import { HistoryList } from '~/components/history-list'
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
import { FORM_CONFIG } from '~/config/form-config'
import { useContentEvents } from '~/hooks/use-content-events'

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
    category,
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
  const { categoryId } = params

  useContentEvents({
    filter: (event) =>
      event.entity === 'article_category' && event.entityId === categoryId,
  })

  const fetcherKey = `category-action-${categoryId}`
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
      action: href('/administration/articles/categories/:categoryId', {
        categoryId,
      }),
      key: fetcherKey,
      withRedirect: true,
    },
  )

  return (
    <AdminPage>
      <PageTitle>{category.name}</PageTitle>

      <AdminActionGroup>
        {canEdit && (
          <LinkButton
            disabled={isSubmitting}
            to={href('/administration/articles/categories/:categoryId/edit', {
              categoryId,
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
          contentId={category.id}
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
        {canPublish && (
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
          <AdminDetailItem label="Název">{category.name}</AdminDetailItem>
          <AdminDetailItem label="Slug">{category.slug}</AdminDetailItem>
          <AdminDetailItem label="Stav">
            <StatusTag state={submission ?? category.state} />
          </AdminDetailItem>
          <AdminDetailItem label="Autor">
            {category.author.name}
          </AdminDetailItem>
        </AdminDetailList>
      </AdminDetailSection>

      <AdminDetailSection title="Historie">
        <HistoryList
          entries={category.history.entries}
          isIncomplete={category.history.isIncomplete}
          // A reused route component starts every record collapsed.
          key={category.id}
          visibleCount={5}
        />
      </AdminDetailSection>

      <AdminDeleteConfirmationDialog ref={deleteConfirmationDialogRef} />
      {/* The edit dialog (/edit) opens over the detail (design 30a). */}
      <Outlet />
    </AdminPage>
  )
}
