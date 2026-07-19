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
import { AdminImageGallery } from '~/components/admin/admin-image-gallery'
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
    article,
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
  const { articleId } = params

  // Selected mode of the draft publish split button (Coordinators only).
  const [publishMode, setPublishMode] = useState<PublishMode>('publish')

  const fetcherKey = `article-action-${articleId}`
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

  const deleteConfirmationDialogRef = useRef<HTMLDialogElement>(null)
  const backdatedPublishDialogRef = useRef<HTMLDialogElement>(null)
  const changePublishedAtDialogRef = useRef<HTMLDialogElement>(null)

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
          <AdminDetailItem label="Stav">
            <AdminStateBadge state={article.state} />
          </AdminDetailItem>
          <AdminDetailItem label="Název">{article.title}</AdminDetailItem>
          <AdminDetailItem label="Slug">{article.slug}</AdminDetailItem>
          <AdminDetailItem label="Autoři">
            {article.authors.map((author) => author.name).join(', ')}
          </AdminDetailItem>
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
              sources: img.sources,
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
                label={`${review.reviewer.name} (${getAuthorRoleLabel(review.reviewer.roleName)})`}
              >
                {review.createdAt}
              </AdminDetailItem>
            ))}
          </Activity>
          <AdminDetailItem label="Schváleno koordinátorem">
            {article.hasApprovingReview ? 'Ano' : 'Ne'}
          </AdminDetailItem>
        </AdminDetailList>
      </AdminDetailSection>

      <AdminDeleteConfirmationDialog ref={deleteConfirmationDialogRef} />

      <AdminPublishDateDialog
        action={href('/administration/articles/:articleId', { articleId })}
        confirmLabel={'Zveřejnit'}
        description={
          'Článek bude publikován se zvoleným datem v minulosti a zařadí se tak na odpovídající místo ve výpisu článků.'
        }
        fetcherKey={fetcherKey}
        intent={INTENT_VALUE.publish}
        ref={backdatedPublishDialogRef}
        title={'Zveřejnit zpětně'}
      />

      <AdminPublishDateDialog
        action={href('/administration/articles/:articleId', { articleId })}
        confirmLabel={'Změnit datum'}
        defaultValue={article.publishedAtInputValue}
        description={
          'Skutečně si přejete změnit datum vydání? Článek se přeřadí ve výpisu a změní se datum publikace v metadatech pro vyhledávače. Akce je určena k opravě chyb.'
        }
        fetcherKey={fetcherKey}
        intent={INTENT_VALUE.changePublishedAt}
        ref={changePublishedAtDialogRef}
        title={'Změnit datum vydání'}
      />
    </AdminPage>
  )
}
