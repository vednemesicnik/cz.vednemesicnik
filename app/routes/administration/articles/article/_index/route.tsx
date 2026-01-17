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
import { AdminImageGallery } from '~/components/admin-image-gallery'
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
    article,
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
  const { articleId } = params

  const fetcherKey = `article-action-${articleId}`
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
      action: href('/administration/articles/:articleId', { articleId }),
      key: fetcherKey,
      withRedirect: true,
    },
  )

  return (
    <AdminPage>
      <AdminHeadline>{article.title}</AdminHeadline>

      <AdminActionGroup>
        {canUpdate && (
          <AdminLinkButton
            disabled={isSubmitting}
            to={href('/administration/articles/:articleId/edit-article', {
              articleId,
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
          <AdminDetailItem label="Stav">
            <AdminStateBadge state={article.state} />
          </AdminDetailItem>
          <AdminDetailItem label="Název">{article.title}</AdminDetailItem>
          <AdminDetailItem label="Slug">{article.slug}</AdminDetailItem>
          <AdminDetailItem label="Autor">{article.author.name}</AdminDetailItem>
          <AdminDetailItem label="Odkaz na článek">
            <Hyperlink
              href={href('/articles/:articleSlug', {
                articleSlug: article.slug,
              })}
            >
              /articles/{article.slug}
            </Hyperlink>
          </AdminDetailItem>
        </AdminDetailList>
      </AdminDetailSection>

      <AdminDetailSection title="Kategorizace">
        <AdminDetailList>
          <AdminDetailItem label="Rubriky">
            {article.categories.length > 0
              ? article.categories.map((cat) => cat.name).join(', ')
              : 'Žádné rubriky'}
          </AdminDetailItem>
          <AdminDetailItem label="Štítky">
            {article.tags.length > 0
              ? article.tags.map((tag) => tag.name).join(', ')
              : 'Žádné štítky'}
          </AdminDetailItem>
        </AdminDetailList>
      </AdminDetailSection>

      <AdminDetailSection title="Obrázky">
        {article.images.length > 0 ? (
          <AdminImageGallery
            featuredImageId={article.featuredImageId}
            images={article.images.map((img) => ({
              id: img.id,
              src: img.url,
            }))}
          />
        ) : (
          <AdminDetailList>
            <AdminDetailItem label="Galerie obrázků">
              Žádné obrázky
            </AdminDetailItem>
          </AdminDetailList>
        )}
      </AdminDetailSection>

      <AdminDetailSection title="Metadata">
        <AdminDetailList>
          <AdminDetailItem label="Vytvořeno">
            {article.createdAt}
          </AdminDetailItem>
          <AdminDetailItem label="Aktualizováno">
            {article.updatedAt}
          </AdminDetailItem>
          {article.publishedAt && (
            <AdminDetailItem label="Datum publikování">
              {article.publishedAt}
            </AdminDetailItem>
          )}
        </AdminDetailList>
      </AdminDetailSection>

      <AdminDetailSection title="Schválení">
        <AdminDetailList>
          <Activity mode={article.reviews.length > 0 ? 'visible' : 'hidden'}>
            {article.reviews.map((review) => (
              <AdminDetailItem
                key={review.id}
                label={`${review.reviewer.name} (${review.reviewer.roleName === 'coordinator' ? 'Koordinátor' : 'Tvůrce'})`}
              >
                {review.createdAt}
              </AdminDetailItem>
            ))}
          </Activity>
          <AdminDetailItem label="Schváleno koordinátorem">
            {article.hasCoordinatorReview ? 'Ano' : 'Ne'}
          </AdminDetailItem>
        </AdminDetailList>
      </AdminDetailSection>

      <AdminDeleteConfirmationDialog ref={deleteConfirmationDialogRef} />
    </AdminPage>
  )
}
