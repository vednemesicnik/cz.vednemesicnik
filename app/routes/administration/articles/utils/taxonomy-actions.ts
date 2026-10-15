import { FORM_CONFIG } from '~/config/form-config'

import type { ArticleAction } from './article-actions'

const INTENT_VALUE = FORM_CONFIG.intent.value

/**
 * An action on a category or tag in its list row: the article's set (07c)
 * without a publish date to change.
 */
export type TaxonomyAction = Exclude<ArticleAction, 'change-date'>

// Three dots announce a dialog (07c). A category or tag picks no publish date,
// so publishing and retracting run at once until design answers 3vnah8ji.
// Archivovat… gets its dots only when it asks first (25d).
export const TAXONOMY_ACTION_LABELS: Record<TaxonomyAction, string> = {
  approve: 'Schválit',
  'approve-and-publish': 'Schválit a publikovat',
  archive: 'Archivovat',
  delete: 'Smazat…',
  edit: 'Upravit',
  publish: 'Publikovat',
  restore: 'Obnovit jako koncept',
  retract: 'Stáhnout z publikace',
  return: 'Vrátit k úpravám',
  submit: 'Odeslat ke schválení',
  'view-on-web': 'Zobrazit na webu',
  withdraw: 'Vzít zpět do konceptu',
}

// The actions that change the state in one click. The Coordinator's publish
// of a waiting one is the approval (07b), hence one intent for both.
export const TAXONOMY_DIRECT_INTENTS: Partial<Record<TaxonomyAction, string>> =
  {
    approve: INTENT_VALUE.review,
    'approve-and-publish': INTENT_VALUE.publish,
    archive: INTENT_VALUE.archive,
    publish: INTENT_VALUE.publish,
    restore: INTENT_VALUE.restore,
    retract: INTENT_VALUE.retract,
    return: INTENT_VALUE.returnForEdits,
    submit: INTENT_VALUE.submitForReview,
    withdraw: INTENT_VALUE.withdrawSubmission,
  }
