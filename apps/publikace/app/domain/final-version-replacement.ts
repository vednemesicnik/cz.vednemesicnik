/**
 * A new final version marked in the issue detail after the job has taken the clauses of the
 * standing one, and before every author agreed to it (#90, `12r`, `12s`). Worded as the copywriter
 * settled it (`injg8rmg`).
 *
 * Until a run takes a clause, _Zrušit finální verzi_ and marking again is the way, so the two
 * steps never stand side by side. Once every author agreed, a change after it is _Upraveno po
 * schválení_, not this step.
 */

import type { ClauseDetail } from './approvals.ts'
import { type ArticleStep, type FinalVersion, whoOf } from './article.ts'
import type { RaceToast } from './handover.ts'
import { tied } from './public/typography.ts'
import { formatDayMonth, formatMoment } from './time.ts'

/** Whether an editor-in-chief may mark a new version in place of this one (`12r`). */
export function isReplaceable(
  finalVersion: Pick<FinalVersion, 'clauses' | 'isCancellable'>,
): boolean {
  let { clauses } = finalVersion
  return !finalVersion.isCancellable && clauses.approved < clauses.total
}

/* `12r`: the row's „⋯“ and the dialog. */

export const REPLACE_FINAL_LABEL = 'Označit novou finální verzi…'
export const REPLACE_FINAL_DIALOG_TITLE = 'Označit novou finální verzi?'
export const REPLACE_FINAL_CONFIRM_LABEL = 'Označit novou verzi'

/** Without _znovu_: an author whose clause was still to send gets the request for the first time. */
export const REPLACE_DIALOG_MAIL = tied`Každému autorovi se pošle nové PDF s žádostí o souhlas s redakční doložkou, i tomu, kdo už s dřívější verzí souhlasí.`

/** The version is named by the time it was marked, as more than one can be marked in a day. */
export function replaceDialogEarlier(markedAt: Temporal.Instant, today: Temporal.Instant): string {
  return tied`Žádosti k verzi z ${formatMoment(markedAt, today)} přestanou platit. Dosavadní souhlasy se do nové verze nezapočítají.`
}

export function replaceDialogCancel(markedAt: Temporal.Instant, today: Temporal.Instant): string {
  return tied`Do začátku odesílání e-mailů autorům můžete novou verzi zrušit. Zrušením se obnoví verze z ${formatMoment(markedAt, today)}.`
}

/* `12s`: the toasts after the step, after its cancel, and when the row is no longer true. */

export const NEW_FINAL_SAVED_TOAST = tied`Nová finální verze je uložená.`

/** After cancelling a new version: the one it replaced stands again, as it was. */
export function restoredToast(markedAt: Temporal.Instant, today: Temporal.Instant): string {
  return tied`Znovu platí finální verze z ${formatMoment(markedAt, today)}.`
}

/** Somebody marked a newer version meanwhile, or the page showed an older one: which one stands. */
export function alreadyReplacedToast(standing: ArticleStep, today: Temporal.Instant): RaceToast {
  return {
    detail: tied`Platná verze: ${formatMoment(standing.at, today)} · ${whoOf(standing)}`,
    message: tied`Finální verze už je nahrazená.`,
  }
}

export const ALL_APPROVED_TOAST = tied`S touto verzí už souhlasili všichni autoři. Nová finální verze se neuložila.`

/* `12s`: a replaced version in the open row, a record with nothing left to do. */

export function replacedSummary(markedAt: Temporal.Instant, today: Temporal.Instant): string {
  return tied`Nahrazená verze z ${formatMoment(markedAt, today)}`
}

/**
 * Who marked it and when it was replaced. The time belongs to the replacement, not to the
 * consents recorded beside it (`znor6hp8`). Who replaced it is the _Označení_ of the version just
 * above it, so it is not said twice.
 */
export function replacedMarkedLine(
  version: Pick<ArticleStep, 'email' | 'name'> & { replacedAt: Temporal.Instant },
  today: Temporal.Instant,
): string {
  return tied`Označení: ${whoOf(version)} · nahrazena ${formatMoment(version.replacedAt, today)}`
}

export const REPLACED_CLAUSES_LABEL = 'Stav doložek při nahrazení verze'

/** What a screen reader hears after _Otevřít PDF_ of a replaced version: which one, and where. */
export function replacedPdfHint(markedAt: Temporal.Instant, today: Temporal.Instant): string {
  return tied` verze z ${formatMoment(markedAt, today)} (otevře se v nové záložce)`
}

/** A clause of a replaced version: a grey tag, the line beside it, and a reply quoted in full. */
export type ReplacedClauseTag = { detail: string | null; label: string; quote: string | null }

/**
 * The words promise nothing: _Bez odpovědi_ is „no reply until the replacement“, as the reply
 * check stopped asking, an e-mail that never went is _Neodesláno_ and one the Mailer did not
 * confirm _Bez potvrzení odeslání_, both without the job's text, since nothing of the record can
 * be mended. A consent whose archive failed is still a consent.
 */
export function replacedClauseTag(
  clause: ClauseDetail,
  today: Temporal.Instant,
): ReplacedClauseTag {
  let tag = { detail: null, quote: null }
  let replyAt = clause.replyReceivedAt === null ? null : formatMoment(clause.replyReceivedAt, today)
  switch (clause.state) {
    case 'approved': {
      let at = clause.replyReceivedAt ?? clause.approvedAt
      return { ...tag, detail: at === null ? null : formatMoment(at, today), label: 'Souhlasí' }
    }
    case 'verified':
      return { ...tag, label: 'Souhlas zaznamenán' }
    case 'waiting':
      return {
        ...tag,
        detail:
          clause.sentAt === null ? null : tied`Žádost odeslána ${formatDayMonth(clause.sentAt)}`,
        label: 'Bez odpovědi',
      }
    case 'review':
      return { detail: replyAt, label: 'Jiná odpověď', quote: clause.replyText }
    case 'pending':
      return { ...tag, label: 'Neodesláno' }
    case 'unsent':
      return { ...tag, label: 'Bez potvrzení odeslání' }
    case 'unarchived':
      return {
        ...tag,
        detail:
          replyAt === null
            ? tied`konverzace se neuložila do složky Licence`
            : tied`${replyAt} · konverzace se neuložila do složky Licence`,
        label: 'Souhlasí',
      }
  }
}

/*
 * _Upraveno po schválení_ (#101, `12b`, `12q`): every author agreed and the Doc was edited after
 * its PDF. The same step as `12r`, from a button in the row, worded as the copywriter settled it
 * (`znor6hp8`, the button's name for a screen reader `dd5fjcle`). Nothing is said of the
 * podklady pro tisk: they keep the last approved version, and their own section says so (`12t`).
 */

/** Short enough for the action cell's 200 px; the dialog's title names the final version. */
export const MARK_REVISED_LABEL = 'Označit novou verzi…'

/** Starts with the visible words, as its siblings in the row do (`dd5fjcle`). */
export function markRevisedButtonLabel(articleName: string): string {
  return tied`Označit novou verzi článku ${articleName}`
}

export const REVISED_CALLOUT_TITLE = tied`Text dokumentu byl po uložení PDF upraven`

/** The newest revision, then the version the authors agreed to, then the one step. */
export function revisedCalloutText(
  revisedAt: Temporal.Instant,
  markedAt: Temporal.Instant,
  today: Temporal.Instant,
): string {
  return tied`Poslední úprava textu ${formatMoment(revisedAt, today)}. Autoři souhlasili s verzí z ${formatMoment(markedAt, today)}. Až bude text hotový, označte novou finální verzi.`
}

/**
 * What a screen reader hears when the detail's own check finds approved texts edited after their
 * PDF, in place of the tint the eye sees (`12q`). A count, since a name runs to 200 characters,
 * and the tag's exact words, which the reader then looks for. Worded by the copywriter
 * (`7s7yseap`).
 */
export function revisedAnnouncement(count: number): string {
  if (count === 1) return tied`Nově má 1 článek stav „Upraveno po schválení“.`
  if (count >= 2 && count <= 4) return tied`Nově mají ${count} články stav „Upraveno po schválení“.`
  return tied`Nově má ${count} článků stav „Upraveno po schválení“.`
}

/** Beside _Souhlasí_ in place of the reply's time: which version the consent belongs to. */
export function agreedWithLine(markedAt: Temporal.Instant, today: Temporal.Instant): string {
  return tied`s verzí z ${formatMoment(markedAt, today)}`
}

export const REVISED_DIALOG_MAIL = tied`Každému autorovi se pošle nové PDF s žádostí o souhlas s redakční doložkou.`

/** In place of `12r`'s requests that stop counting: every request was answered by a consent. */
export function revisedDialogConsents(markedAt: Temporal.Instant, today: Temporal.Instant): string {
  return tied`Souhlasy s verzí z ${formatMoment(markedAt, today)} zůstanou v Licencích. Do nové verze se nezapočítají.`
}

export const REVISED_DIALOG_CANCEL = tied`Do začátku odesílání e-mailů autorům můžete novou verzi zrušit. Obnoví se tím předchozí verze i se souhlasy.`

/** After cancelling a new version that took the place of one every author agreed to. */
export function revisedRestoredToast(markedAt: Temporal.Instant, today: Temporal.Instant): string {
  return tied`Verze z ${formatMoment(markedAt, today)} je obnovená i se souhlasy.`
}
