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

// Three dots announce a dialog (07c).
export const ARTICLE_ACTION_LABELS: Record<ArticleAction, string> = {
  approve: 'Schválit',
  'approve-and-publish': 'Schválit a publikovat…',
  archive: 'Archivovat…',
  'change-date': 'Změnit datum publikace…',
  delete: 'Smazat…',
  edit: 'Upravit',
  publish: 'Publikovat…',
  restore: 'Obnovit jako koncept',
  retract: 'Stáhnout z publikace…',
  return: 'Vrátit k úpravám',
  submit: 'Odeslat ke schválení',
  'view-on-web': 'Zobrazit na webu',
  withdraw: 'Vzít zpět do konceptu',
}

// The actions that change the state in one click, without a dialog.
export const ARTICLE_DIRECT_INTENTS: Partial<Record<ArticleAction, string>> = {
  approve: INTENT_VALUE.review,
  restore: INTENT_VALUE.restore,
  return: INTENT_VALUE.returnForEdits,
  submit: INTENT_VALUE.submitForReview,
  withdraw: INTENT_VALUE.withdrawSubmission,
}

// A draft nobody submitted, published by the Coordinator (23d, 23f).
export const NOT_SUBMITTED_NOTE = 'Článek nebyl odeslán ke schválení.'

/**
 * The sentence a detail header shows beside or instead of its buttons (23d):
 * who may do what the role may not, or that a draft wasn't submitted.
 */
export type HeaderSentence =
  | 'not-submitted'
  | 'who-edits'
  | 'who-approves'
  | 'who-publishes'
  | 'who-restores'

export const ARTICLE_HEADER_SENTENCES: Record<HeaderSentence, string> = {
  'not-submitted': NOT_SUBMITTED_NOTE,
  'who-approves': 'Schválit může Koordinátor.',
  'who-edits': 'Upravovat mohou autoři článku a Koordinátor.',
  'who-publishes': 'Publikovat může Koordinátor.',
  'who-restores': 'Obnovit článek může Koordinátor.',
}
