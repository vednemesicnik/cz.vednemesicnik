/**
 * The comment digest of the issues made in the app (#170): `SCRIPT__Publication__Article_Comments`
 * reads each article's Doc for new comments, replies and suggestions and mails every author one
 * e-mail (`20e`) with all of their articles that have something new. The app hands it the articles
 * and keeps how far each was told of; the text of a comment and who wrote it never reach it. What
 * a person reads of the job (`14d`, `14e`, `14i`) went through the copywriter (`0a92jylv`,
 * `xtucsmfj`) and stands in the drawing (`ezhxaz35`).
 */

import { type HourlyWindows, RUN_LIMIT_MINUTES } from './job-run.ts'
import { tied } from './public/typography.ts'

export const ARTICLE_COMMENTS_JOB = 'article-comments'
export const ARTICLE_COMMENTS_JOB_NAME = 'Připomínky ke článkům'
/* A word joiner after the hyphen, so _e-mailem_ never breaks at it (`14d`). */
export const ARTICLE_COMMENTS_SUMMARY = tied`upozorní autory e-⁠mailem na nové připomínky`

/** `everyHours(3)` from midnight in Prague: Google picks the minute within each hour (`14d`). */
export const ARTICLE_COMMENTS_WINDOWS: HourlyWindows = { everyHours: 3, fromHour: 0 }

/** An article claimed this recently is not handed to another run: one run lasts ten minutes at most. */
export const CLAIM_MINUTES = RUN_LIMIT_MINUTES

/**
 * The articles one run may take, those told of longest ago first. The open issues hold tens of
 * articles each, so a run takes them all; a run cut short by its time leaves the rest to the next.
 */
export const ARTICLE_CLAIM_LIMIT = 200

/** More suggestions than a Doc holds open; the limit only stops nonsense. */
export const MAX_SUGGESTION_HASHES = 1000

/** A SHA-256 in hex is 64 characters; the job's hashes are never longer. */
export const MAX_SUGGESTION_HASH_LENGTH = 64

/** More than any error text a run reports; the rest is cut. */
export const ERROR_TEXT_LIMIT = 2000

/** An e-mail to one author the Mailer did not confirm, with an article it was about. */
export type UnconfirmedEmail = { articleName: string; email: string }

/** How a run of the job ended, as it is kept with the run (`job_runs.summary`). */
export type CommentDigestRun = {
  /** The job itself reported the run failed, beyond any e-mail it could not confirm. */
  hasFailed: boolean
  /** The e-mails the Mailer confirmed. */
  sent: number
  unconfirmed: readonly UnconfirmedEmail[]
}

export function writeCommentDigestRun(run: CommentDigestRun): string {
  return JSON.stringify(run)
}

export function readCommentDigestRun(text: string | null): CommentDigestRun | null {
  if (text === null) return null
  try {
    let value: unknown = JSON.parse(text)
    if (typeof value !== 'object' || value === null) return null
    let { hasFailed, sent, unconfirmed } = value as Record<string, unknown>
    if (typeof hasFailed !== 'boolean' || typeof sent !== 'number' || !Array.isArray(unconfirmed)) {
      return null
    }
    let emails: UnconfirmedEmail[] = []
    for (let each of unconfirmed as unknown[]) {
      if (typeof each !== 'object' || each === null) return null
      let { articleName, email } = each as Record<string, unknown>
      if (typeof articleName !== 'string' || typeof email !== 'string') return null
      emails.push({ articleName, email })
    }
    return { hasFailed, sent, unconfirmed: emails }
  } catch {
    return null
  }
}

/**
 * _S chybou_ when the job said so or any e-mail went unconfirmed (`14d`): an author may not have
 * heard of a comment. One such run does not put the job in the banner, two in a row do.
 */
export function commentDigestOutcome(run: CommentDigestRun): 'failed' | 'ok' {
  return run.hasFailed || run.unconfirmed.length > 0 ? 'failed' : 'ok'
}

/** The e-mails, one per address: an author hears of all of their articles in one (`20e`). */
function unconfirmedCount(run: CommentDigestRun): number {
  return new Set(run.unconfirmed.map((each) => each.email)).size
}

/** _1 e-mail_, _2 e-maily_, _5 e-mailů_ — the form follows the number (`0a92jylv`). */
function emails(count: number): string {
  if (count === 1) return '1 e-mail'
  if (count >= 2 && count <= 4) return `${count} e-maily`
  return `${count} e-mailů`
}

/** _1 e-mailu_, _2 e-mailů_: after _u_ and _Odeslání_. */
function emailsOf(count: number): string {
  return count === 1 ? '1 e-mailu' : `${count} e-mailů`
}

/**
 * A run in the history (`14e`). An unconfirmed e-mail never reads as _Poslala 0 e-mailů_: more may
 * have gone than the Mailer confirmed. A run the job reported failed is the job's _Skončila
 * s chybou_, whatever it sent.
 */
export function commentDigestRunEvent(run: CommentDigestRun): string | null {
  if (run.hasFailed) return null
  let unconfirmed = unconfirmedCount(run)
  if (unconfirmed === 0) {
    return run.sent === 0 ? tied`Nic nového k poslání` : `Poslala ${emails(run.sent)}`
  }
  let missing = `${emailsOf(unconfirmed)} chybí potvrzení odeslání`
  return run.sent === 0 ? tied`U ${missing}` : `Poslala ${emails(run.sent)} · ${tied`u ${missing}`}`
}

/** What the tag's line adds after the last run while e-mails are unconfirmed (`14d`). */
export function commentDigestFailureNote(run: CommentDigestRun): string | null {
  let unconfirmed = unconfirmedCount(run)
  return unconfirmed === 0 ? null : `${emails(unconfirmed)} bez potvrzení`
}

/**
 * One line a recipient over the articles their e-mail was about (`14e`, `ezhxaz35`): the addresses
 * in alphabetical order, the articles under each by name, all of them, as plain text.
 */
export type RecipientGroup = { articles: readonly string[]; lead: string }

/* A word joiner before the colon keeps it with the address, however the address breaks. */
function recipientLead(email: string): string {
  return `E-mail pro ${email}⁠:`
}

export function recipientGroups(run: CommentDigestRun): RecipientGroup[] {
  let byEmail = new Map<string, Set<string>>()
  for (let each of run.unconfirmed) {
    byEmail.set(each.email, (byEmail.get(each.email) ?? new Set()).add(each.articleName))
  }
  let collator = new Intl.Collator('cs')
  return [...byEmail.keys()].sort(collator.compare).map((email) => ({
    articles: [...(byEmail.get(email) ?? [])].sort(collator.compare),
    lead: recipientLead(email),
  }))
}

/** The Callout's title over the history after unconfirmed e-mails (`14e`): it counts e-mails. */
export function unconfirmedCalloutTitle(run: CommentDigestRun): string {
  return `Odeslání ${emailsOf(unconfirmedCount(run))} se nepodařilo potvrdit.`
}

export const UNCONFIRMED_COMMENTS_TEXT = tied`Při dalším běhu se úloha pokusí upozornění odeslat znovu. Na některé připomínky tak může autora upozornit víc než jeden e-mail.`

/** The first sentence of the Callout after a run that failed outright (`14e`). */
export const ARTICLE_COMMENTS_FAILED_CALLOUT = tied`Úloha skončila s chybou. Některá upozornění na připomínky možná neodešla.`
export const ARTICLE_COMMENTS_FAILED_EVENT = tied`Skončila s chybou`

/** The banner's sentence (`14i`): its consequence holds for failed runs and a silent job alike. */
export const ARTICLE_COMMENTS_BANNER = tied`Připomínky ke článkům teď nemusí autorům posílat e-mailová upozornění.`
