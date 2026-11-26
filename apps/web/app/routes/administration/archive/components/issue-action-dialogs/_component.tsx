import type { ContentState } from '@generated/prisma/enums'

import { AdminDeleteConfirmationDialog } from '~/components/admin/admin-delete-confirmation-dialog'
import { AdminDeleteConfirmationDialogActions } from '~/components/admin/admin-delete-confirmation-dialog-actions'
import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalNote } from '~/components/admin/admin-modal-note'
import { AdminModalSubject } from '~/components/admin/admin-modal-subject'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'

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
      <AdminDeleteConfirmationDialog ref={actions.deleteDialogRef}>
        <AdminModalTitle>
          {issue.state === 'archived'
            ? 'Smazat archivované číslo?'
            : 'Smazat koncept?'}
        </AdminModalTitle>
        <AdminModalSubject>{issue.title}</AdminModalSubject>
        <AdminModalDescription>
          Smažou se i jeho nahrané soubory. Vrátit to nejde.
        </AdminModalDescription>
        <AdminDeleteConfirmationDialogActions>
          Smazat
        </AdminDeleteConfirmationDialogActions>
      </AdminDeleteConfirmationDialog>
    )}
    {actions.stateDialog !== null && (
      <IssueStateDialog
        action={actions.detailHref}
        fetcherKey={actions.fetcherKey}
        isApprover={isApprover}
        issueTitle={issue.title}
        kind={actions.stateDialog}
        onClose={actions.closeStateDialog}
      >
        {/* Publishing a draft not submitted, the dialog says so (26h). */}
        {actions.stateDialog === 'publish' && issue.isNotSubmitted && (
          <AdminModalNote>
            {ISSUE_HEADER_SENTENCES['not-submitted']}
          </AdminModalNote>
        )}
      </IssueStateDialog>
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
