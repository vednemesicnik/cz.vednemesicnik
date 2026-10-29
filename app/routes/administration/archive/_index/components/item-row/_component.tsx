import { ActionMenu } from '~/components/action-menu'
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
import { Button } from '~/components/button'
import { Image } from '~/components/image'
import { LinkButton } from '~/components/link-button'
import { StatusTag } from '~/components/status-tag'
import type { LiveChange } from '~/hooks/use-live-changes'
import { getLiveStateDetail } from '~/utils/live-change/get-live-state-detail'
import { getRowTint } from '~/utils/live-change/get-row-tint'

import { IssueActionDialogs } from '../../../components/issue-action-dialogs'
import {
  ISSUE_ACTION_LABELS,
  type IssueAction,
} from '../../../utils/issue-actions'
import { useIssueActions } from '../../../utils/use-issue-actions'
import type { Route } from '../../+types/route'
import styles from './_styles.module.css'

type Issue = Route.ComponentProps['loaderData']['issues'][number]

type Props = {
  issue: Issue
  isApprover: boolean
  selected: boolean
  onSelect: () => void
  liveChange?: LiveChange
}

/**
 * A row of the archive list (design 26a): the cover, the title opening the
 * detail over the PDF as the reader downloads it, the order, the state tag with
 * one fact, and one action with the rest in „⋯“, as the article's row (22a). A
 * supplement is its own row under its issue, tagged *Doplněk*. While someone
 * else edits it, the row says who (26i); one someone else changed while the
 * list is open is tinted for a moment and says who changed it (22f). Below
 * 768 px it folds into the cover beside the name, the state and the order,
 * with „⋯“ holding the row
 * action first (32b).
 */
export const ItemRow = ({
  issue,
  isApprover,
  selected,
  onSelect,
  liveChange,
}: Props) => {
  const actions = useIssueActions({
    fetcherKey: `issue-row-${issue.id}`,
    issue,
  })
  const { detailHref, editHref, isSubmitting, runAction } = actions

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
    <TableRow muted={issue.state === 'archived'} tint={getRowTint(liveChange)}>
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
          detail={getLiveStateDetail({
            factLine: issue.factLine,
            holdLine: issue.holdLine,
            liveChange,
            now: new Date(),
          })}
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
          <IssueActionDialogs
            actions={actions}
            canDelete={issue.menu.includes('delete')}
            isApprover={isApprover}
            issue={issue}
          />
        </div>
      </TableActionsCell>
    </TableRow>
  )
}
