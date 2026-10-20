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
import { HistoryList } from '~/components/history-list'
import { Hyperlink } from '~/components/hyperlink'
import { Image } from '~/components/image'
import { Link } from '~/components/link'
import { LinkButton } from '~/components/link-button'
import { PageTitle } from '~/components/page-title'
import { StatusTag } from '~/components/status-tag'
import { FORM_CONFIG } from '~/config/form-config'
import { useContentActionResult } from '~/hooks/use-content-action-result'
import { useContentEvents } from '~/hooks/use-content-events'

import {
  ISSUE_ACTION_LABELS,
  ISSUE_DIRECT_INTENTS,
  ISSUE_HEADER_SENTENCES,
  ISSUE_SUBMISSION_NOTES,
  type IssueAction,
  type IssueStateAction,
} from '../../utils/issue-actions'
import type { action as issueAction } from './_action'
import styles from './_styles.module.css'
import type { Route } from './+types/route'
import { IssueStateDialog } from './components/issue-state-dialog'

const INTENT_NAME = FORM_CONFIG.intent.name

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({
  loaderData,
  params,
}: Route.ComponentProps) {
  const {
    headerActions,
    isApprover,
    isOwnContent,
    issue,
    submission,
    supplementLinks,
  } = loaderData
  const { issueId } = params

  useContentEvents({
    filter: (event) => event.entity === 'issue' && event.entityId === issueId,
  })

  const fetcherKey = `issue-action-${issueId}`
  const fetcher = useFetcher<typeof issueAction>({ key: fetcherKey })
  const authenticityToken = useAuthenticityToken()
  const navigate = useNavigate()
  useContentActionResult(fetcher.data)

  const [stateDialog, setStateDialog] = useState<IssueStateAction | null>(null)

  const isSubmitting = fetcher.state !== 'idle'

  const detailHref = href('/administration/archive/:issueId', { issueId })
  const editHref = href('/administration/archive/:issueId/edit-issue', {
    issueId,
  })
  // The issue has no page of its own: the web shows it in the archive (26b).
  const archivePath = href('/archive')

  const deleteConfirmationDialogRef = useRef<HTMLDialogElement>(null)

  const { openDialog } = useAdminDeleteConfirmationDialog(
    deleteConfirmationDialogRef,
    { action: detailHref, key: fetcherKey, withRedirect: true },
  )

  const runAction = (headerAction: IssueAction) => {
    const intent = ISSUE_DIRECT_INTENTS[headerAction]

    if (intent !== undefined) {
      const formData = new FormData()
      formData.append(FORM_CONFIG.authenticityToken.name, authenticityToken)
      formData.append(INTENT_NAME, intent)
      void fetcher.submit(formData, { method: 'POST' })
      return
    }

    switch (headerAction) {
      case 'approve-and-publish':
      case 'publish':
      case 'retract':
      case 'archive':
        return setStateDialog(headerAction)
      case 'delete':
        return openDialog()
      case 'edit':
        return navigate(editHref)
      case 'view-on-web':
        return window.open(archivePath, '_blank', 'noopener')
    }
  }

  const renderButton = (
    headerAction: IssueAction,
    variant: 'primary' | 'outline',
  ) => {
    switch (headerAction) {
      case 'edit':
        return (
          <LinkButton disabled={isSubmitting} to={editHref} variant={'outline'}>
            {ISSUE_ACTION_LABELS.edit}
          </LinkButton>
        )
      case 'view-on-web':
        return (
          <LinkButton
            rel={'noopener'}
            target={'_blank'}
            to={archivePath}
            variant={'outline'}
          >
            {ISSUE_ACTION_LABELS['view-on-web']}
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
            {ISSUE_ACTION_LABELS[headerAction]}
          </Button>
        )
    }
  }

  return (
    <AdminPage>
      <header className={styles.header}>
        <div className={styles.title}>
          <div className={styles.titleLine}>
            <PageTitle>{issue.title}</PageTitle>
            <StatusTag state={submission ?? issue.state} />
          </div>
          <span className={styles.subtitle}>
            {issue.authorName} · {issue.factLine}
          </span>
        </div>

        {/* One primary, one outline, the rest in „⋯“; where the role may do nothing, who can (26g). */}
        <div className={styles.actions}>
          {headerActions.sentence !== null && (
            <p className={styles.sentence}>
              {ISSUE_HEADER_SENTENCES[headerActions.sentence]}
            </p>
          )}
          <ActionMenu
            items={headerActions.menu.map((headerAction) => ({
              danger: headerAction === 'delete',
              label: ISSUE_ACTION_LABELS[headerAction],
              onSelect: () => runAction(headerAction),
            }))}
          />
          {headerActions.outline !== null &&
            renderButton(headerActions.outline, 'outline')}
          {headerActions.primary !== null &&
            renderButton(headerActions.primary, 'primary')}
        </div>
      </header>

      {isOwnContent && submission !== null && (
        <AdminParagraph>{ISSUE_SUBMISSION_NOTES[submission]}</AdminParagraph>
      )}

      {/* The files are the issue's content, so they stand where an article has its text (26b). */}
      <AdminDetailLayout>
        <AdminDetailMain>
          <AdminDetailSection title={'Soubory'}>
            <div className={styles.files}>
              <figure className={styles.cover}>
                {issue.cover === null ? (
                  <div className={styles.coverMissing}>Obálka zatím chybí</div>
                ) : (
                  <Image
                    {...issue.cover.sources}
                    alt={issue.cover.altText}
                    className={styles.coverImage}
                    // The grid's breakpoint: a 220 px column beside the card, else full width.
                    sizes={'(width >= 40rem) 220px, 100vw'}
                  />
                )}
                <figcaption className={styles.caption}>Obálka</figcaption>
              </figure>

              <article className={styles.pdf}>
                <h3 className={styles.caption}>PDF</h3>
                {issue.pdf === null ? (
                  <p className={styles.pdfName}>PDF zatím chybí</p>
                ) : (
                  <>
                    {/* The name the reader downloads it under. */}
                    <p className={styles.pdfName}>{issue.pdf.fileName}</p>
                    {/* The name it was uploaded under tells the final version (26b). */}
                    <p className={styles.uploaded}>
                      nahráno{' '}
                      <time dateTime={issue.pdf.uploadedAt.iso}>
                        {issue.pdf.uploadedAt.formatted}
                      </time>
                      {issue.pdf.originalFileName !== null && (
                        <> jako {issue.pdf.originalFileName}</>
                      )}
                    </p>
                    <Hyperlink
                      className={styles.openPdf}
                      href={issue.pdf.path}
                      rel={'noopener'}
                      target={'_blank'}
                    >
                      Otevřít PDF
                    </Hyperlink>
                  </>
                )}
              </article>
            </div>
          </AdminDetailSection>
        </AdminDetailMain>

        <AdminDetailAside>
          <AdminDetailSection title={'Údaje'}>
            <AdminDetailList>
              <AdminDetailItem label={'Pořadí'}>
                {issue.orderLabel}
              </AdminDetailItem>
              <AdminDetailItem label={'Název'}>
                {issue.name ?? '—'}
              </AdminDetailItem>
              {supplementLinks.kind === 'supplements' ? (
                supplementLinks.supplements.length > 0 && (
                  <AdminDetailItem label={'Doplňky'}>
                    <span className={styles.stack}>
                      {supplementLinks.supplements.map(({ id, label }) => (
                        <Link
                          key={id}
                          to={href('/administration/archive/:issueId', {
                            issueId: id,
                          })}
                        >
                          {label}
                        </Link>
                      ))}
                    </span>
                  </AdminDetailItem>
                )
              ) : (
                <AdminDetailItem label={'Doplněk k'}>
                  {/* Without its issue, or one the viewer can't see, only the order (26b, wo02u3xq). */}
                  {supplementLinks.mainIssue === null ? (
                    supplementLinks.orderLabel
                  ) : (
                    <Link
                      to={href('/administration/archive/:issueId', {
                        issueId: supplementLinks.mainIssue.id,
                      })}
                    >
                      {supplementLinks.mainIssue.title}
                    </Link>
                  )}
                </AdminDetailItem>
              )}
              <AdminDetailItem label={'Adresa'}>
                {issue.pdf === null ? (
                  '—'
                ) : issue.isPreviewable ? (
                  // Signed in, the web shows the draft in the archive (26b).
                  <span className={styles.stack}>
                    <Hyperlink
                      href={archivePath}
                      rel={'noopener'}
                      target={'_blank'}
                    >
                      Náhled archivu na webu
                    </Hyperlink>
                    <span className={styles.tertiary}>{issue.pdf.path}</span>
                  </span>
                ) : (
                  <span className={styles.tertiary}>{issue.pdf.path}</span>
                )}
              </AdminDetailItem>
              <AdminDetailItem label={'Autor'}>
                {issue.authorName}
              </AdminDetailItem>
            </AdminDetailList>
          </AdminDetailSection>

          <AdminDetailSection title={'Historie'}>
            <HistoryList
              entries={issue.history.entries}
              isIncomplete={issue.history.isIncomplete}
              // A reused route component starts every record collapsed.
              key={issue.id}
              visibleCount={5}
            />
          </AdminDetailSection>
        </AdminDetailAside>
      </AdminDetailLayout>

      <AdminDeleteConfirmationDialog
        description={'Smažou se i jeho nahrané soubory. Vrátit to nejde.'}
        ref={deleteConfirmationDialogRef}
        subject={issue.title}
        title={
          issue.state === 'archived'
            ? 'Smazat archivované číslo?'
            : 'Smazat koncept?'
        }
      />

      {stateDialog !== null && (
        <IssueStateDialog
          action={detailHref}
          fetcherKey={fetcherKey}
          isApprover={isApprover}
          issueTitle={issue.title}
          kind={stateDialog}
          // A draft nobody submitted is published from „⋯“ (26g); the dialog says so.
          note={
            stateDialog === 'publish' && headerActions.menu.includes('publish')
              ? ISSUE_HEADER_SENTENCES['not-submitted']
              : null
          }
          onClose={() => setStateDialog(null)}
        />
      )}
    </AdminPage>
  )
}
