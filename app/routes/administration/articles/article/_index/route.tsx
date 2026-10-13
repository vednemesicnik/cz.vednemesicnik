// noinspection JSUnusedGlobalSymbols

import { useRef, useState } from 'react'
import { href, useFetcher, useNavigate } from 'react-router'

import { ActionMenu } from '~/components/action-menu'
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
import { AdminParagraph } from '~/components/admin/admin-paragraph'
import { useAuthenticityToken } from '~/components/authenticity-token-provider'
import { Button } from '~/components/button'
import { HistoryList } from '~/components/history-list'
import { Hyperlink } from '~/components/hyperlink'
import { StatusTag } from '~/components/status-tag'
import { FORM_CONFIG } from '~/config/form-config'
import { useContentEvents } from '~/hooks/use-content-events'
import { ArticleChangeDateDialog } from '../../components/article-change-date-dialog'
import { ArticleMissingDialog } from '../../components/article-missing-dialog'
import { ArticlePublishDialog } from '../../components/article-publish-dialog'
import {
  ARTICLE_ACTION_LABELS,
  ARTICLE_DIRECT_INTENTS,
  type ArticleAction,
} from '../../utils/article-actions'
import { useArticleActionResult } from '../../utils/use-article-action-result'
import type { action as articleAction } from './_action'
import styles from './_styles.module.css'
import type { Route } from './+types/route'
import { getHeaderActions } from './utils/get-header-actions'

const INTENT_NAME = FORM_CONFIG.intent.name
const INTENT_VALUE = FORM_CONFIG.intent.value

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({
  loaderData,
  params,
}: Route.ComponentProps) {
  const { article, isOwnContent, missingBeforePublish, submission } = loaderData
  const { articleId } = params

  useContentEvents({
    filter: (event) =>
      event.entity === 'article' && event.entityId === articleId,
  })

  const fetcherKey = `article-action-${articleId}`
  const fetcher = useFetcher<typeof articleAction>({ key: fetcherKey })
  const authenticityToken = useAuthenticityToken()
  const navigate = useNavigate()

  const headerActions = getHeaderActions({
    ...loaderData,
    state: article.state,
    submission: submission?.state ?? null,
  })

  const { closeMissingList, missingList, showMissingList } =
    useArticleActionResult(fetcher.data)
  const [publishDialog, setPublishDialog] = useState<{
    isApproval: boolean
  } | null>(null)

  const isSubmitting = fetcher.state !== 'idle'

  const deleteConfirmationDialogRef = useRef<HTMLDialogElement>(null)
  const changePublishedAtDialogRef = useRef<HTMLDialogElement>(null)

  const { openDialog } = useAdminDeleteConfirmationDialog(
    deleteConfirmationDialogRef,
    {
      action: href('/administration/articles/:articleId', { articleId }),
      key: fetcherKey,
      withRedirect: true,
    },
  )

  const editHref = href('/administration/articles/:articleId/edit-article', {
    articleId,
  })

  // An incomplete article opens the 23h list instead of the date dialog.
  const openPublishDialog = (isApproval: boolean) => {
    if (missingBeforePublish.length > 0) {
      showMissingList({
        intent: INTENT_VALUE.publish,
        items: missingBeforePublish,
      })
      return
    }

    setPublishDialog({ isApproval })
  }

  const runAction = (headerAction: ArticleAction) => {
    const intent = ARTICLE_DIRECT_INTENTS[headerAction]

    if (intent !== undefined) {
      const formData = new FormData()
      formData.append(FORM_CONFIG.authenticityToken.name, authenticityToken)
      formData.append(INTENT_NAME, intent)
      void fetcher.submit(formData, { method: 'POST' })
      return
    }

    switch (headerAction) {
      case 'approve-and-publish':
        return openPublishDialog(true)
      case 'publish':
        return openPublishDialog(false)
      case 'change-date':
        return changePublishedAtDialogRef.current?.showModal()
      case 'delete':
        return openDialog()
      case 'edit':
        return navigate(editHref)
    }
  }

  const renderButton = (
    headerAction: ArticleAction,
    variant: 'primary' | 'outline',
  ) => {
    switch (headerAction) {
      case 'edit':
        return (
          <AdminLinkButton
            className={styles.outlineLink}
            disabled={isSubmitting}
            to={editHref}
          >
            {ARTICLE_ACTION_LABELS.edit}
          </AdminLinkButton>
        )
      case 'view-on-web':
        return (
          <AdminLinkButton
            className={styles.outlineLink}
            rel={'noopener'}
            target={'_blank'}
            to={href('/articles/:articleSlug', { articleSlug: article.slug })}
          >
            {ARTICLE_ACTION_LABELS['view-on-web']}
          </AdminLinkButton>
        )
      default:
        return (
          <Button
            disabled={isSubmitting}
            onClick={() => runAction(headerAction)}
            type={'button'}
            variant={variant}
          >
            {ARTICLE_ACTION_LABELS[headerAction]}
          </Button>
        )
    }
  }

  return (
    <AdminPage>
      <div className={styles.header}>
        <AdminHeadline>{article.title}</AdminHeadline>

        {/* One primary, one outline, the rest in „⋯“; where the role may do nothing, who can (23d). */}
        <div className={styles.actions}>
          {headerActions.sentence !== null && (
            <p className={styles.sentence}>{headerActions.sentence}</p>
          )}
          <ActionMenu
            items={headerActions.menu.map((headerAction) => ({
              danger: headerAction === 'delete',
              label: ARTICLE_ACTION_LABELS[headerAction],
              onSelect: () => runAction(headerAction),
            }))}
          />
          {headerActions.outline !== null &&
            renderButton(headerActions.outline, 'outline')}
          {headerActions.primary !== null &&
            renderButton(headerActions.primary, 'primary')}
        </div>
      </div>

      {isOwnContent && submission !== null && (
        <AdminParagraph>
          {submission.state === 'pending'
            ? 'Článek čeká na schválení Koordinátorem. Před úpravou ho vezměte zpět do konceptu a po úpravě znovu odešlete ke schválení.'
            : 'Článek je schválený. Publikovat ho může Koordinátor. Před úpravou ho vezměte zpět do konceptu. Schválení se tím zruší.'}
        </AdminParagraph>
      )}

      <AdminDetailSection title="Základní informace">
        <AdminDetailList>
          <AdminDetailItem label="Stav">
            <StatusTag
              detail={
                submission === null
                  ? undefined
                  : submission.state === 'pending'
                    ? `od ${submission.date}`
                    : submission.date
              }
              state={submission?.state ?? article.state}
            />
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

      <AdminDetailSection title="Historie">
        <HistoryList
          entries={article.history.entries}
          isIncomplete={article.history.isIncomplete}
          // A reused route component starts every record collapsed.
          key={article.id}
          visibleCount={5}
        />
      </AdminDetailSection>

      <AdminDeleteConfirmationDialog ref={deleteConfirmationDialogRef} />

      {missingList !== null && (
        <ArticleMissingDialog
          editHref={editHref}
          missingList={missingList}
          onClose={closeMissingList}
        />
      )}

      {publishDialog !== null && (
        <ArticlePublishDialog
          action={href('/administration/articles/:articleId', { articleId })}
          articleTitle={article.title}
          authorNames={article.authors.map((author) => author.name)}
          fetcherKey={fetcherKey}
          isApproval={publishDialog.isApproval}
          // A draft nobody submitted is published from „⋯“ (23d); the dialog says so.
          note={
            headerActions.menu.includes('publish')
              ? headerActions.sentence
              : null
          }
          onClose={() => setPublishDialog(null)}
          originalPublishedAt={article.publishedAt.iso}
        />
      )}

      <ArticleChangeDateDialog
        action={href('/administration/articles/:articleId', { articleId })}
        fetcherKey={fetcherKey}
        publishedAt={article.publishedAt.iso}
        ref={changePublishedAtDialogRef}
      />
    </AdminPage>
  )
}
