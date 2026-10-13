// noinspection JSUnusedGlobalSymbols

import { useRef, useState } from 'react'
import { href, useFetcher, useNavigate } from 'react-router'

import { ActionMenu } from '~/components/action-menu'
import {
  AdminDeleteConfirmationDialog,
  useAdminDeleteConfirmationDialog,
} from '~/components/admin/admin-delete-confirmation-dialog'
import { AdminDetailAside } from '~/components/admin/admin-detail-aside'
import { AdminDetailItem } from '~/components/admin/admin-detail-item'
import { AdminDetailLayout } from '~/components/admin/admin-detail-layout'
import { AdminDetailList } from '~/components/admin/admin-detail-list'
import { AdminDetailMain } from '~/components/admin/admin-detail-main'
import { AdminDetailSection } from '~/components/admin/admin-detail-section'
import { AdminPage } from '~/components/admin/admin-page'
import { AdminParagraph } from '~/components/admin/admin-paragraph'
import { useAuthenticityToken } from '~/components/authenticity-token-provider'
import { Button } from '~/components/button'
import { ContentRenderer } from '~/components/content-renderer'
import { FeaturedImage } from '~/components/featured-image'
import { HistoryList } from '~/components/history-list'
import { Hyperlink } from '~/components/hyperlink'
import { LinkButton } from '~/components/link-button'
import { PageTitle } from '~/components/page-title'
import { StatusTag } from '~/components/status-tag'
import { FORM_CONFIG } from '~/config/form-config'
import { useContentActionResult } from '~/hooks/use-content-action-result'
import { useContentEvents } from '~/hooks/use-content-events'
import { ArticleChangeDateDialog } from '../../components/article-change-date-dialog'
import { ArticleMissingDialog } from '../../components/article-missing-dialog'
import { ArticlePublishDialog } from '../../components/article-publish-dialog'
import {
  ArticleStateDialog,
  type ArticleStateDialogKind,
} from '../../components/article-state-dialog'
import {
  ARTICLE_ACTION_LABELS,
  ARTICLE_DIRECT_INTENTS,
  type ArticleAction,
} from '../../utils/article-actions'
import type { action as articleAction } from './_action'
import styles from './_styles.module.css'
import type { Route } from './+types/route'
import { getHeaderActions } from './utils/get-header-actions'

const INTENT_NAME = FORM_CONFIG.intent.name
const INTENT_VALUE = FORM_CONFIG.intent.value

// Every name, or a dash where there is none.
const joinNames = (items: { name: string }[]) =>
  items.length > 0 ? items.map((item) => item.name).join(', ') : '—'

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({
  loaderData,
  params,
}: Route.ComponentProps) {
  const {
    article,
    isApprover,
    isOwnContent,
    missingBeforePublish,
    submission,
  } = loaderData
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
    submission,
  })

  const { closeMissingList, missingList, showMissingList } =
    useContentActionResult(fetcher.data)
  const [stateDialog, setStateDialog] = useState<ArticleStateDialogKind | null>(
    null,
  )
  const [publishDialog, setPublishDialog] = useState<{
    isApproval: boolean
  } | null>(null)

  const isSubmitting = fetcher.state !== 'idle'

  const deleteConfirmationDialogRef = useRef<HTMLDialogElement>(null)
  const [isChangeDateOpen, setIsChangeDateOpen] = useState(false)

  const { openDialog } = useAdminDeleteConfirmationDialog(
    deleteConfirmationDialogRef,
    {
      action: href('/administration/articles/:articleId', { articleId }),
      key: fetcherKey,
      withRedirect: true,
    },
  )

  const authorNames = article.authors.map((author) => author.name)
  const articlePath = href('/articles/:articleSlug', {
    articleSlug: article.slug,
  })

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
      case 'retract':
      case 'archive':
        return setStateDialog(headerAction)
      case 'change-date':
        return setIsChangeDateOpen(true)
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
          <LinkButton disabled={isSubmitting} to={editHref} variant={'outline'}>
            {ARTICLE_ACTION_LABELS.edit}
          </LinkButton>
        )
      case 'view-on-web':
        return (
          <LinkButton
            rel={'noopener'}
            target={'_blank'}
            to={articlePath}
            variant={'outline'}
          >
            {ARTICLE_ACTION_LABELS['view-on-web']}
          </LinkButton>
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
        <div className={styles.title}>
          <div className={styles.titleLine}>
            <PageTitle>{article.title}</PageTitle>
            <StatusTag state={submission ?? article.state} />
          </div>
          <span className={styles.subtitle}>
            {authorNames.join(', ')} · {article.factLine}
          </span>
        </div>

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
          {submission === 'pending'
            ? 'Článek čeká na schválení Koordinátorem. Před úpravou ho vezměte zpět do konceptu a po úpravě znovu odešlete ke schválení.'
            : 'Článek je schválený. Publikovat ho může Koordinátor. Před úpravou ho vezměte zpět do konceptu. Schválení se tím zruší.'}
        </AdminParagraph>
      )}

      {/* The text on the left, set as on the web; the details beside it (23a). */}
      <AdminDetailLayout>
        <AdminDetailMain>
          <article className={styles.article}>
            {article.featuredImage && (
              <FeaturedImage
                alt={article.featuredImage.altText}
                description={
                  <ContentRenderer
                    content={article.featuredImage.description}
                  />
                }
                image={article.featuredImage.sources}
                imageClassName={styles.featuredImage}
              />
            )}
            <ContentRenderer content={article.content} />
          </article>
        </AdminDetailMain>

        <AdminDetailAside>
          <AdminDetailSection title={'Údaje'}>
            <AdminDetailList>
              <AdminDetailItem label={'Adresa'}>
                {article.state === 'published' ? (
                  articlePath
                ) : (
                  <span className={styles.stack}>
                    <Hyperlink
                      href={articlePath}
                      rel={'noopener'}
                      target={'_blank'}
                    >
                      Náhled na webu
                    </Hyperlink>
                    <span className={styles.tertiary}>{articlePath}</span>
                  </span>
                )}
              </AdminDetailItem>
              <AdminDetailItem label={'Perex'}>
                <span className={styles.stack}>
                  <span>{article.excerpt ?? '—'}</span>
                  <span className={styles.note}>pro vyhledávače a sdílení</span>
                </span>
              </AdminDetailItem>
              <AdminDetailItem label={'Autoři'}>
                {authorNames.join(', ')}
              </AdminDetailItem>
              <AdminDetailItem label={'Rubriky'}>
                {joinNames(article.categories)}
              </AdminDetailItem>
              <AdminDetailItem label={'Štítky'}>
                {joinNames(article.tags)}
              </AdminDetailItem>
              <AdminDetailItem label={'Obrázky'}>
                {article.imageCount}
              </AdminDetailItem>
            </AdminDetailList>
          </AdminDetailSection>

          <AdminDetailSection title={'Historie'}>
            <HistoryList
              entries={article.history.entries}
              isIncomplete={article.history.isIncomplete}
              // A reused route component starts every record collapsed.
              key={article.id}
              visibleCount={5}
            />
          </AdminDetailSection>
        </AdminDetailAside>
      </AdminDetailLayout>

      <AdminDeleteConfirmationDialog
        description={'Smazání je nevratné.'}
        ref={deleteConfirmationDialogRef}
        subject={article.title}
        title={
          article.state === 'archived'
            ? 'Smazat archivovaný článek?'
            : 'Smazat koncept?'
        }
      />

      {stateDialog !== null && (
        <ArticleStateDialog
          action={href('/administration/articles/:articleId', { articleId })}
          articleTitle={article.title}
          fetcherKey={fetcherKey}
          isApprover={isApprover}
          kind={stateDialog}
          onClose={() => setStateDialog(null)}
        />
      )}

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
          authorNames={authorNames}
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

      {isChangeDateOpen && (
        <ArticleChangeDateDialog
          action={href('/administration/articles/:articleId', { articleId })}
          articleTitle={article.title}
          fetcherKey={fetcherKey}
          onClose={() => setIsChangeDateOpen(false)}
          publishedAt={article.publishedAt.iso}
        />
      )}
    </AdminPage>
  )
}
