// noinspection JSUnusedGlobalSymbols

import { Activity, useEffect, useRef, useState } from 'react'
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
import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { AdminPage } from '~/components/admin/admin-page'
import { AdminParagraph } from '~/components/admin/admin-paragraph'
import { AdminPublishDateDialog } from '~/components/admin/admin-publish-date-dialog'
import { AdminStateBadge } from '~/components/admin/admin-state-badge'
import { useAuthenticityToken } from '~/components/authenticity-token-provider'
import { BulletedList } from '~/components/bulleted-list'
import { Button } from '~/components/button'
import { Hyperlink } from '~/components/hyperlink'
import { ListItem } from '~/components/list-item'
import { useToast } from '~/components/toast-provider'
import { FORM_CONFIG } from '~/config/form-config'
import { getAuthorRoleLabel } from '~/utils/role-labels'

import type { action as articleAction } from './_action'
import styles from './_styles.module.css'
import type { Route } from './+types/route'
import { ArticlePublishDialog } from './components/article-publish-dialog'
import { getHeaderActions, type HeaderAction } from './utils/get-header-actions'

const INTENT_NAME = FORM_CONFIG.intent.name
const INTENT_VALUE = FORM_CONFIG.intent.value

// Three dots announce a dialog (07c). Retract and archive get theirs in 23e.
const ACTION_LABELS: Record<HeaderAction, string> = {
  approve: 'Schválit',
  'approve-and-publish': 'Schválit a publikovat…',
  archive: 'Archivovat',
  'change-date': 'Změnit datum publikace…',
  delete: 'Smazat…',
  edit: 'Upravit',
  publish: 'Publikovat…',
  restore: 'Obnovit jako koncept',
  retract: 'Stáhnout z publikace',
  return: 'Vrátit k úpravám',
  submit: 'Odeslat ke schválení',
  'view-on-web': 'Zobrazit na webu',
  withdraw: 'Vzít zpět do konceptu',
}

// The actions that change the state in one click, without a dialog.
const DIRECT_INTENTS: Partial<Record<HeaderAction, string>> = {
  approve: INTENT_VALUE.review,
  archive: INTENT_VALUE.archive,
  restore: INTENT_VALUE.restore,
  retract: INTENT_VALUE.retract,
  return: INTENT_VALUE.returnForEdits,
  submit: INTENT_VALUE.submitForReview,
  withdraw: INTENT_VALUE.withdrawSubmission,
}

// Toasts after an action (design 23a, 23b, 23c, 23f).
const ACTION_TOASTS: Record<string, string> = {
  [INTENT_VALUE.publish]: 'Publikováno',
  [INTENT_VALUE.returnForEdits]: 'Vráceno k úpravám',
  [INTENT_VALUE.review]: 'Schváleno',
  [INTENT_VALUE.submitForReview]: 'Odesláno ke schválení',
  [INTENT_VALUE.withdrawSubmission]: 'Vráceno do konceptu',
}

type MissingList = {
  intent: string
  items: string[]
}

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({
  loaderData,
  params,
}: Route.ComponentProps) {
  const { article, isOwnContent, missingBeforePublish, submission } = loaderData
  const { articleId } = params

  const fetcherKey = `article-action-${articleId}`
  const fetcher = useFetcher<typeof articleAction>({ key: fetcherKey })
  const authenticityToken = useAuthenticityToken()
  const navigate = useNavigate()

  const headerActions = getHeaderActions({
    ...loaderData,
    state: article.state,
    submission: submission?.state ?? null,
  })

  const showToast = useToast()
  const missingDialogRef = useRef<HTMLDialogElement>(null)
  const [missingList, setMissingList] = useState<MissingList | null>(null)
  const [publishDialog, setPublishDialog] = useState<{
    isApproval: boolean
  } | null>(null)
  const actionResult = fetcher.data
  // A keyed fetcher keeps its data across remounts; answer only a new result.
  const handledResultRef = useRef(actionResult)

  // An action answers once: a toast, or the 23h list of what is missing before
  // the article can be submitted or published.
  useEffect(() => {
    if (
      actionResult === undefined ||
      actionResult === handledResultRef.current
    ) {
      return
    }
    handledResultRef.current = actionResult

    if (actionResult.missing.length > 0) {
      setMissingList({
        intent: actionResult.intent,
        items: actionResult.missing,
      })
      return
    }

    const toast = ACTION_TOASTS[actionResult.intent]
    if (toast !== undefined) showToast(toast)
  }, [showToast, actionResult])

  useEffect(() => {
    if (missingList !== null) missingDialogRef.current?.showModal()
  }, [missingList])

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
      setMissingList({
        intent: INTENT_VALUE.publish,
        items: missingBeforePublish,
      })
      return
    }

    setPublishDialog({ isApproval })
  }

  const runAction = (headerAction: HeaderAction) => {
    const intent = DIRECT_INTENTS[headerAction]

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
    headerAction: HeaderAction,
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
            {ACTION_LABELS.edit}
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
            {ACTION_LABELS['view-on-web']}
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
            {ACTION_LABELS[headerAction]}
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
              label: ACTION_LABELS[headerAction],
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
            <AdminStateBadge
              state={article.state}
              submission={submission?.state}
            />
            {submission !== null &&
              (submission.state === 'pending'
                ? ` od ${submission.date}`
                : ` ${submission.date}`)}
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
            {article.createdAt.formatted}
          </AdminDetailItem>
          <AdminDetailItem label="Aktualizováno">
            {article.updatedAt.formatted}
          </AdminDetailItem>
          {article.publishedAt.iso && (
            <AdminDetailItem label="Datum publikování">
              {article.publishedAt.formatted}
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
                {review.createdAt.formatted}
              </AdminDetailItem>
            ))}
          </Activity>
          <AdminDetailItem label="Schváleno koordinátorem">
            {article.hasApprovingReview ? 'Ano' : 'Ne'}
          </AdminDetailItem>
        </AdminDetailList>
      </AdminDetailSection>

      <AdminDeleteConfirmationDialog ref={deleteConfirmationDialogRef} />

      <AdminDialog ref={missingDialogRef}>
        <AdminModalContent>
          <AdminModalTitle>
            {missingList?.intent === INTENT_VALUE.publish
              ? 'Článek ještě nejde publikovat'
              : 'Článek ještě nejde odeslat'}
          </AdminModalTitle>
          <BulletedList>
            {missingList?.items.map((item) => (
              <ListItem key={item}>{item}</ListItem>
            ))}
          </BulletedList>
          <AdminModalActions>
            <Button
              onClick={() => missingDialogRef.current?.close()}
              size={'sm'}
              type={'button'}
              variant={'ghost'}
            >
              Zavřít
            </Button>
            <AdminLinkButton to={editHref}>Doplnit v editoru</AdminLinkButton>
          </AdminModalActions>
        </AdminModalContent>
      </AdminDialog>

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

      <AdminPublishDateDialog
        action={href('/administration/articles/:articleId', { articleId })}
        confirmLabel={'Změnit datum'}
        defaultPublishedAt={article.publishedAt.iso ?? undefined}
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
