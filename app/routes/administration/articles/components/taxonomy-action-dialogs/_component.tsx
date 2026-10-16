import { AdminDeleteConfirmationDialog } from '~/components/admin/admin-delete-confirmation-dialog'

import {
  TAXONOMY_ACTION_LABELS,
  TAXONOMY_DIRECT_INTENTS,
} from '../../utils/taxonomy-actions'
import type { useTaxonomyActions } from '../../utils/use-taxonomy-actions'
import { TaxonomyConfirmDialog } from '../taxonomy-confirm-dialog'

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
        <TaxonomyConfirmDialog
          action={actions.detailHref}
          confirmLabel={TAXONOMY_ACTION_LABELS[confirmAction]}
          description={confirmCopy[confirmAction].description}
          fetcherKey={actions.fetcherKey}
          intent={TAXONOMY_DIRECT_INTENTS[confirmAction]}
          onClose={closeConfirm}
          title={confirmCopy[confirmAction].title}
        />
      )}
    </>
  )
}
