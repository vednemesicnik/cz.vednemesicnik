import { FORM_CONFIG } from '~/config/form-config'

import type {
  ArticleAction,
  HeaderSentence,
} from '../../articles/utils/article-actions'

const INTENT_VALUE = FORM_CONFIG.intent.value

/**
 * An action on an issue in its detail's header (design 26b): the article's set
 * (07c) without a publish date to change, and without an edit hold to take over.
 */
export type IssueAction = Exclude<ArticleAction, 'change-date' | 'take-over'>

/** An action that changes the web, confirmed in a dialog first (07c). */
export type IssueStateAction = Extract<
  IssueAction,
  'approve-and-publish' | 'archive' | 'publish' | 'retract'
>

// Three dots announce a dialog (07c). The issue has no page of its own, so the
// web shows the archive (26b, qjv38ti4).
export const ISSUE_ACTION_LABELS: Record<IssueAction, string> = {
  approve: 'Schválit',
  'approve-and-publish': 'Schválit a publikovat…',
  archive: 'Archivovat…',
  delete: 'Smazat…',
  edit: 'Upravit',
  publish: 'Publikovat…',
  restore: 'Obnovit jako koncept',
  retract: 'Stáhnout z publikace…',
  return: 'Vrátit k úpravám',
  submit: 'Odeslat ke schválení',
  'view-on-web': 'Zobrazit archiv na webu',
  withdraw: 'Vzít zpět do konceptu',
}

// The actions that change the state in one click, without a dialog.
export const ISSUE_DIRECT_INTENTS: Partial<Record<IssueAction, string>> = {
  approve: INTENT_VALUE.review,
  restore: INTENT_VALUE.restore,
  return: INTENT_VALUE.returnForEdits,
  submit: INTENT_VALUE.submitForReview,
  withdraw: INTENT_VALUE.withdrawSubmission,
}

// The article's sentences said of an issue, which has one author (26g, qjv38ti4).
export const ISSUE_HEADER_SENTENCES: Record<HeaderSentence, string> = {
  'not-submitted': 'Číslo nebylo odesláno ke schválení.',
  'who-approves': 'Schválit může Koordinátor.',
  'who-edits': 'Upravovat mohou autor čísla a Koordinátor.',
  'who-publishes': 'Publikovat může Koordinátor.',
  'who-restores': 'Obnovit číslo může Koordinátor.',
}

// What the author of a submitted issue reads under its header (26g, qjv38ti4).
export const ISSUE_SUBMISSION_NOTES = {
  approved:
    'Číslo je schválené. Publikovat ho může Koordinátor. Před úpravou ho vezměte zpět do konceptu. Schválení se tím zruší.',
  pending:
    'Číslo čeká na schválení Koordinátorem. Před úpravou ho vezměte zpět do konceptu a po úpravě znovu odešlete ke schválení.',
} as const
