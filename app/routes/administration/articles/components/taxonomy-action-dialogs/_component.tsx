import { AdminDeleteConfirmationDialog } from '~/components/admin/admin-delete-confirmation-dialog'
import { AdminModalDescription } from '~/components/admin/admin-modal-description'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { StateChangeDialog } from '~/components/state-change-dialog'

import {
  TAXONOMY_ACTION_LABELS,
  TAXONOMY_DIRECT_INTENTS,
} from '../../utils/taxonomy-actions'
import type { useTaxonomyActions } from '../../utils/use-taxonomy-actions'

type Props = {
  actions: ReturnType<typeof useTaxonomyActions>
  canDelete: boolean
}

/**
 * The dialogs of a category's or tag's actions (design 25d): Smazat… with how
 * many articles lose the record, and Archivovat… or Stáhnout z publikace…
 * with what readers lose.
 *
 * @param props.actions - The record's `useTaxonomyActions`.
 * @param props.canDelete - Whether Smazat… is offered, so its dialog exists.
 */
export const TaxonomyActionDialogs = ({ actions, canDelete }: Props) => {
  const { closeConfirm, confirmAction, copy, record } = actions

  const confirmCopy = {
    archive: {
      description: copy.archiveDescription,
      title: copy.archiveTitle(record.name),
    },
    retract: {
      description: copy.retractDescription(record.publishedArticleCount),
      title: copy.retractTitle(record.name),
    },
  }

  return (
    <>
      {canDelete && (
        <AdminDeleteConfirmationDialog
          description={copy.deleteDescription(record.articleCount)}
          ref={actions.deleteDialogRef}
          title={copy.deleteTitle(record.name)}
        />
      )}
      {confirmAction !== null && (
        <StateChangeDialog
          action={actions.detailHref}
          confirmLabel={TAXONOMY_ACTION_LABELS[confirmAction]}
          fetcherKey={actions.fetcherKey}
          intent={TAXONOMY_DIRECT_INTENTS[confirmAction]}
          onClose={closeConfirm}
        >
          {/* The record's name is in the question: no record line (25d). */}
          <AdminModalTitle>{confirmCopy[confirmAction].title}</AdminModalTitle>
          <AdminModalDescription>
            {confirmCopy[confirmAction].description}
          </AdminModalDescription>
        </StateChangeDialog>
      )}
    </>
  )
}
