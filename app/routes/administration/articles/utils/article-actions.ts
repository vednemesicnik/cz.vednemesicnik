import { FORM_CONFIG } from '~/config/form-config'

const INTENT_VALUE = FORM_CONFIG.intent.value

/** An action on an article, on its detail's header or in a list row (design 07c). */
export type ArticleAction =
  | 'approve'
  | 'approve-and-publish'
  | 'archive'
  | 'change-date'
  | 'delete'
  | 'edit'
  | 'publish'
  | 'restore'
  | 'retract'
  | 'return'
  | 'submit'
  | 'view-on-web'
  | 'withdraw'

// Three dots announce a dialog (07c). Retract and archive get theirs in 23e.
export const ARTICLE_ACTION_LABELS: Record<ArticleAction, string> = {
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
export const ARTICLE_DIRECT_INTENTS: Partial<Record<ArticleAction, string>> = {
  approve: INTENT_VALUE.review,
  archive: INTENT_VALUE.archive,
  restore: INTENT_VALUE.restore,
  retract: INTENT_VALUE.retract,
  return: INTENT_VALUE.returnForEdits,
  submit: INTENT_VALUE.submitForReview,
  withdraw: INTENT_VALUE.withdrawSubmission,
}

// A draft nobody submitted, published by the Coordinator (23d, 23f).
export const NOT_SUBMITTED_NOTE = 'Článek nebyl odeslán ke schválení.'
