import { useRef, useState } from 'react'
import { href, useFetcher, useNavigate } from 'react-router'

import { ActionMenu } from '~/components/action-menu'
import {
  AdminDeleteConfirmationDialog,
  useAdminDeleteConfirmationDialog,
} from '~/components/admin/admin-delete-confirmation-dialog'
import {
  TableActionsCell,
  TableCell,
  TableDetailsCell,
  TableDetailsLine,
  TableImageCell,
  TableNameAddress,
  TableNameCell,
  TableRow,
  TableRowActions,
  TableRowLink,
  TableRowMenu,
  TableSelectionCell,
  TableStateCell,
} from '~/components/admin/admin-table'
import { useAuthenticityToken } from '~/components/authenticity-token-provider'
import { Button } from '~/components/button'
import { Image } from '~/components/image'
import { LinkButton } from '~/components/link-button'
import { StatusTag } from '~/components/status-tag'
import { FORM_CONFIG } from '~/config/form-config'
import { useContentActionResult } from '~/hooks/use-content-action-result'

import { IssueMissingDialog } from '../../../components/issue-missing-dialog'
import { IssueStateDialog } from '../../../components/issue-state-dialog'
import type { action as issueAction } from '../../../issue/_index/_action'
import {
  ISSUE_ACTION_LABELS,
  ISSUE_DIRECT_INTENTS,
  ISSUE_HEADER_SENTENCES,
  type IssueAction,
  type IssueStateAction,
} from '../../../utils/issue-actions'
import type { Route } from '../../+types/route'
import styles from './_styles.module.css'

type Issue = Route.ComponentProps['loaderData']['issues'][number]

type Props = {
  issue: Issue
  isApprover: boolean
  selected: boolean
  onSelect: () => void
}

/**
 * A row of the archive list (design 26a): the cover, the title opening the
 * detail over the PDF as the reader downloads it, the order, the state tag with
 * one fact, and one action with the rest in „⋯“, as the article's row (22a). A
 * supplement is its own row under its issue, tagged *Doplněk*. While someone
 * else edits it, the row says who (26i). Below 768 px it folds into the
 * cover beside the name, the state and the order, with „⋯“ holding the row
 * action first (32b).
 */
export const ItemRow = ({ issue, isApprover, selected, onSelect }: Props) => {
  const { id } = issue
  const detailHref = href('/administration/archive/:issueId', { issueId: id })
  const editHref = href('/administration/archive/:issueId/edit-issue', {
    issueId: id,
  })
  // The issue has no page of its own: the web shows it in the archive (26b).
  const archivePath = href('/archive')

  const fetcherKey = `issue-row-${id}`
  const fetcher = useFetcher<typeof issueAction>({ key: fetcherKey })
  const isSubmitting = fetcher.state !== 'idle'
  const authenticityToken = useAuthenticityToken()
  const navigate = useNavigate()
  // A submit the server finds incomplete lists what is missing (26e); an
  // action the edit hold refused says who edits the issue (26i).
  const { closeMissingList, missingList, showMissingList } =
    useContentActionResult(fetcher.data, { heldSubject: 'číslo' })

  const [stateDialog, setStateDialog] = useState<IssueStateAction | null>(null)

  const deleteDialogRef = useRef<HTMLDialogElement>(null)
  const { openDialog: openDeleteDialog } = useAdminDeleteConfirmationDialog(
    deleteDialogRef,
    { action: detailHref, key: fetcherKey },
  )

  const runAction = (issueRowAction: IssueAction) => {
    const intent = ISSUE_DIRECT_INTENTS[issueRowAction]

    if (intent !== undefined) {
      const formData = new FormData()
      formData.append(FORM_CONFIG.authenticityToken.name, authenticityToken)
      formData.append(FORM_CONFIG.intent.name, intent)
      void fetcher.submit(formData, { action: detailHref, method: 'POST' })
      return
    }

    switch (issueRowAction) {
      case 'approve-and-publish':
      case 'publish':
        // An incomplete issue says what it lacks instead (26e).
        if (issue.missingBeforePublish.length > 0) {
          return showMissingList({
            intent: FORM_CONFIG.intent.value.publish,
            items: issue.missingBeforePublish,
          })
        }
        return setStateDialog(issueRowAction)
      case 'retract':
      case 'archive':
        return setStateDialog(issueRowAction)
      case 'delete':
        return openDeleteDialog()
      case 'edit':
      case 'take-over':
        return navigate(editHref)
      case 'view-on-web':
        return window.open(archivePath, '_blank', 'noopener')
    }
  }

  const rowAction = issue.row
  const toMenuItem = (menuAction: IssueAction) => ({
    danger: menuAction === 'delete',
    label: ISSUE_ACTION_LABELS[menuAction],
    onSelect: () => runAction(menuAction),
  })
  // On a phone „⋯“ stands alone, the row action first in it (32b).
  const phoneMenu = rowAction === null ? issue.menu : [rowAction, ...issue.menu]
  // The file's name is an address, which a phone leaves out; a missing file
  // still says so, at the end (32b, k7d1vqm1).
  const phoneDetails = [
    issue.orderLabel,
    issue.pdfFileName === null ? 'PDF zatím chybí' : null,
  ].filter((part) => part !== null)

  return (
    <TableRow muted={issue.state === 'archived'}>
      <TableSelectionCell
        checked={selected}
        disabled={issue.bulkActions.length === 0}
        label={`Vybrat číslo ${issue.title}`}
        onChange={onSelect}
      />
      <TableImageCell>
        {/* The editorial board knows an issue by its cover first (26a). */}
        {issue.cover === null ? (
          <div className={styles.coverMissing} />
        ) : (
          <Image {...issue.cover} className={styles.cover} sizes={'40px'} />
        )}
      </TableImageCell>
      <TableNameCell>
        {issue.supplement === null ? (
          <TableRowLink className={styles.link} to={detailHref}>
            {issue.title}
          </TableRowLink>
        ) : (
          // A supplement is named by its own name beside the tag (26a).
          <span className={styles.supplement}>
            <span className={styles.supplementTag}>Doplněk</span>
            <TableRowLink to={detailHref}>{issue.supplement}</TableRowLink>
          </span>
        )}
        <TableNameAddress>
          {issue.pdfFileName ?? 'PDF zatím chybí'}
        </TableNameAddress>
      </TableNameCell>
      <TableCell>
        <span className={styles.title}>
          {issue.orderLabel ?? '—'}
          {issue.supplement !== null && (
            <span className={styles.secondLine}>doplněk</span>
          )}
        </span>
      </TableCell>
      <TableStateCell>
        <StatusTag
          // Who edits it comes first: it changes what the row allows (26i).
          detail={issue.holdLine ?? issue.factLine ?? undefined}
          state={issue.submission ?? issue.state}
        />
      </TableStateCell>
      {phoneDetails.length > 0 && (
        <TableDetailsCell>
          <TableDetailsLine>{phoneDetails.join(' · ')}</TableDetailsLine>
        </TableDetailsCell>
      )}
      <TableActionsCell>
        {phoneMenu.length > 0 && (
          <TableRowMenu phoneOnly={true}>
            <ActionMenu
              items={phoneMenu.map(toMenuItem)}
              label={`Další akce s číslem ${issue.title}`}
              size={'sm'}
            />
          </TableRowMenu>
        )}
        <TableRowActions>
          {rowAction === 'edit' && (
            <LinkButton
              disabled={isSubmitting}
              size={'sm'}
              to={editHref}
              variant={'outline'}
            >
              {ISSUE_ACTION_LABELS.edit}
            </LinkButton>
          )}
          {rowAction !== null && rowAction !== 'edit' && (
            <Button
              disabled={isSubmitting}
              onClick={() => runAction(rowAction)}
              size={'sm'}
              type={'button'}
              variant={'outline'}
            >
              {ISSUE_ACTION_LABELS[rowAction]}
            </Button>
          )}
          {issue.menu.length > 0 && (
            <ActionMenu
              items={issue.menu.map(toMenuItem)}
              label={`Další akce s číslem ${issue.title}`}
              size={'sm'}
            />
          )}
        </TableRowActions>

        {/* The cell aligns right and doesn't wrap; its dialogs shouldn't inherit that. */}
        <div className={styles.dialogs}>
          {issue.menu.includes('delete') && (
            <AdminDeleteConfirmationDialog
              description={'Smažou se i jeho nahrané soubory. Vrátit to nejde.'}
              ref={deleteDialogRef}
              subject={issue.title}
              title={
                issue.state === 'archived'
                  ? 'Smazat archivované číslo?'
                  : 'Smazat koncept?'
              }
            />
          )}
          {stateDialog !== null && (
            <IssueStateDialog
              action={detailHref}
              fetcherKey={fetcherKey}
              isApprover={isApprover}
              issueTitle={issue.title}
              kind={stateDialog}
              // Publishing a draft not submitted, the dialog says so (26h).
              note={
                stateDialog === 'publish' && issue.isNotSubmitted
                  ? ISSUE_HEADER_SENTENCES['not-submitted']
                  : null
              }
              onClose={() => setStateDialog(null)}
            />
          )}
          {missingList !== null && (
            <IssueMissingDialog
              editHref={editHref}
              missingList={missingList}
              onClose={closeMissingList}
            />
          )}
        </div>
      </TableActionsCell>
    </TableRow>
  )
}
