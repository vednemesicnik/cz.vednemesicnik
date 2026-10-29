import type { ContentState } from '@generated/prisma/enums'

import { AdminDeleteConfirmationDialog } from '~/components/admin/admin-delete-confirmation-dialog'

import { ISSUE_HEADER_SENTENCES } from '../../utils/issue-actions'
import type { useIssueActions } from '../../utils/use-issue-actions'
import { IssueMissingDialog } from '../issue-missing-dialog'
import { IssueStateDialog } from '../issue-state-dialog'

type Props = {
  actions: ReturnType<typeof useIssueActions>
  issue: {
    title: string
    state: ContentState
    isNotSubmitted: boolean
  }
  canDelete: boolean
  isApprover: boolean
}

/**
 * The dialogs of an issue's row actions (design 26d, 26e, 26h): Smazat…,
 * Publikovat…, Stáhnout z publikace… or Archivovat…, and what an incomplete
 * issue lacks.
 *
 * @param props.actions - The issue's `useIssueActions`.
 * @param props.issue - What the dialogs say about it.
 * @param props.canDelete - Whether Smazat… is offered, so its dialog exists.
 * @param props.isApprover - Whether the signed-in author is the Coordinator.
 */
export const IssueActionDialogs = ({
  actions,
  issue,
  canDelete,
  isApprover,
}: Props) => (
  <>
    {canDelete && (
      <AdminDeleteConfirmationDialog
        description={'Smažou se i jeho nahrané soubory. Vrátit to nejde.'}
        ref={actions.deleteDialogRef}
        subject={issue.title}
        title={
          issue.state === 'archived'
            ? 'Smazat archivované číslo?'
            : 'Smazat koncept?'
        }
      />
    )}
    {actions.stateDialog !== null && (
      <IssueStateDialog
        action={actions.detailHref}
        fetcherKey={actions.fetcherKey}
        isApprover={isApprover}
        issueTitle={issue.title}
        kind={actions.stateDialog}
        // Publishing a draft not submitted, the dialog says so (26h).
        note={
          actions.stateDialog === 'publish' && issue.isNotSubmitted
            ? ISSUE_HEADER_SENTENCES['not-submitted']
            : null
        }
        onClose={actions.closeStateDialog}
      />
    )}
    {actions.missingList !== null && (
      <IssueMissingDialog
        editHref={actions.editHref}
        missingList={actions.missingList}
        onClose={actions.closeMissingList}
      />
    )}
  </>
)
