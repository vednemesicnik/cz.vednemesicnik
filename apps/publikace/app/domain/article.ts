/**
 * Articles (_články_): the record the Doc's scripts read, and the words `20a`–`20d` and the
 * welcome e-mail give them. The form's rules are in `public/article-form.ts`, which the browser
 * loads too, and are re-exported here.
 */

import type { ClauseCounts, ClauseDetail } from './approvals.ts'
import type { Author } from './public/article-form.ts'
import { formatDayMonth } from './time.ts'
import { NBSP, tied } from './public/typography.ts'

export {
  REQUIRED_LEGEND,
  ARTICLE_NAME_LABEL,
  ARTICLE_NAME_PLACEHOLDER,
  AUTHORS_LEGEND,
  AUTHORS_HINT,
  AUTHOR_NAME_LABEL,
  AUTHOR_NAME_PLACEHOLDER,
  AUTHOR_EMAIL_LABEL,
  AUTHOR_EMAIL_PLACEHOLDER,
  ADD_AUTHOR_LABEL,
  REMOVE_AUTHOR_LABEL,
  CONSENT_SENTENCE,
  CREATE_ARTICLE_LABEL,
  CREATING_ARTICLE_LABEL,
  authorCardTitle,
  removeAuthorName,
  AUTHOR_LIMIT_NOTE,
  checkArticle,
  duplicateEmailMessage,
  EMPTY_ARTICLE_NAME_MESSAGE,
  EMPTY_AUTHOR_EMAIL_MESSAGE,
  EMPTY_AUTHOR_NAME_MESSAGE,
  fieldLabel,
  INVALID_EMAIL_MESSAGE,
  LONG_ARTICLE_NAME_MESSAGE,
  MAX_ARTICLE_NAME_LENGTH,
  MAX_AUTHORS,
  MISSING_AT_MESSAGE,
  summaryTitle,
} from './public/article-form.ts'
export type {
  ArticleCheck,
  ArticleInput,
  Author,
  AuthorInput,
  FieldError,
  FieldKey,
} from './public/article-form.ts'

/* `20a`, as the copywriter settled them (il3qqrj9). */
export const ARTICLE_PAGE_TITLE = 'Nový článek'
export const ARTICLE_PAGE_LEAD = tied`Pro článek vytvoříme dokument Google. V uvítacím e-mailu najdou autoři odkaz na dokument i na nahrání obrazových děl.`
export function issueLine(issueName: string): string {
  return `Vydání ${issueName}`
}

/* The warnings under the lead, checked when the page opens (`20a`; `dkssdpyc`, `1jv85zum`). */
export const ACCOUNT_DISCONNECTED_WARNING =
  'Zkuste článek vytvořit později, nebo dejte vědět šéfredakci.'
export const ARTICLES_FOLDER_GONE_WARNING = tied`Z tohoto odkazu teď nejde založit článek. Šéfredakce vidí problém v aplikaci.`

/* `20c`: a step as the Callout's title, the result under it. */
export type SubmitMessage = { text: string; title: string }

export const LINK_GONE_ON_SUBMIT: SubmitMessage = {
  text: tied`Tento odkaz mezitím přestal platit a článek se nevytvořil. Vyplněné údaje jsou stále na této stránce.`,
  title: tied`Napište šéfredakci o aktuální odkaz.`,
}
export const DRIVE_UNAVAILABLE_ON_SUBMIT: SubmitMessage = {
  text: 'Článek se nevytvořil.',
  title: 'Zkuste článek vytvořit za chvíli znovu.',
}
export const LIMIT_REACHED_ON_SUBMIT: SubmitMessage = {
  text: tied`Z tohoto odkazu už za poslední hodinu vzniklo 30 článků. Pokud článek potřebujete založit hned, napište šéfredakci.`,
  title: 'Zkuste článek vytvořit později.',
}

export const DAILY_CAP_ON_SUBMIT: SubmitMessage = {
  text: tied`Dnes už z formulářů Publikace odešlo příliš mnoho e-mailů. Údaje zůstávají ve formuláři.`,
  title: 'Zkuste článek vytvořit později.',
}

/** Thirty articles in the last sixty minutes from one link (`02a`, `03` row 15). */
export const SUBMISSIONS_PER_HOUR = 30

/* `20d`. */
export const CREATED_TITLE = 'Článek je založený'

export function createdLead(articleName: string, issueName: string): string {
  return `„${articleName}“ je ve vydání ${issueName}.`
}

/** Only when the welcome e-mail went to every author; otherwise the page says nothing of it. */
export const ALL_WELCOMES_SENT = 'Uvítací e-mail jsme odeslali na všechny uvedené adresy.'
export const OPEN_DOCUMENT_LABEL = 'Otevřít dokument'
export const UPLOAD_ARTWORKS_LABEL = 'Nahrát obrazová díla'
/**
 * The one later step the page after creating and the welcome e-mail both name, in the same words
 * (`20d`, z7q2ypod): nothing reminds anybody to hand a finished text over, so it is said up front.
 * Every other later step comes in an e-mail of its own when it is due.
 */
export const HAND_OVER_STEP = 'Až bude text připravený ke korektuře, dejte prosím vědět šéfredakci.'
export const ANOTHER_ARTICLE_LABEL = 'Založit další článek'

/** `Alex Novák`, `Alex Novák a Robin Malá`, `Alex Novák, Robin Malá a Jan Novák`. */
export function joinNames(names: readonly string[], and = ' a '): string {
  if (names.length <= 1) return names[0] ?? ''
  return `${names.slice(0, -1).join(', ')}${and}${names.at(-1)}`
}

/**
 * The welcome e-mail's line about the other authors, or `null` for a single author. The verb
 * follows the count alone: the app knows no gender (`docs/copy-context.md`). The _a_ before the
 * last name is the e-mail's own word and stays with that name; the names stay as typed.
 */
export function coauthorLine(coauthors: readonly string[]): string | null {
  if (coauthors.length === 0) return null
  let verb = coauthors.length === 1 ? 'podílí' : 'podílejí'
  return `Na článku se také ${verb} ${joinNames(coauthors, ` a${NBSP}`)}.`
}

/**
 * Where an article is, as far as the app records it (`01a`). A standing final version wins, and
 * its clauses decide in the order of precedence `01a` gives: _Chyba_ when the job could not send a
 * clause or archive a consent, _Ke kontrole_ while a reply waits on the editors-in-chief,
 * _Schváleno_ once every author's conversation is in `Licence`, else _K souhlasu_; with every
 * conversation there and a revision of the Doc after its PDF, _Upraveno po schválení_. Without one,
 * _Korektura_ wins while a proofreader's take stands, whatever was handed over; _Dopsáno_ is a
 * handover the editors-in-chief made and no proofreader has taken yet. A proofreader may take an
 * article straight from _Píše se_ too, on the page Korektura (`01d`, `15a`).
 */
export type ArticleState =
  | 'approved'
  | 'consent'
  | 'error'
  | 'handedOver'
  | 'proofreading'
  | 'review'
  | 'revised'
  | 'writing'

/** Somebody's step on an article: when, and who, by address and by the name Google gave. */
export type ArticleStep = { at: Temporal.Instant; email: string; name: string | null }

/**
 * The final version that stands (`15f`): who marked it and when, its PDF, and its clauses per
 * state. `isCancellable` while no run of the job has taken a clause: from then on an e-mail may
 * be on its way (`15g`). `reviewAuthor` is the author whose reply has waited longest in
 * _Ke kontrole_, the name under that tag.
 */
export type FinalVersion = ArticleStep & {
  /** Each author's clause in the order of the article's authors, for the open row (`12b`). */
  authors: readonly ClauseDetail[]
  clauses: ClauseCounts
  /**
   * The newest revision of the Doc after its PDF was exported, as the issue detail last found it
   * on Drive (#101); `null` while none was found.
   */
  docRevisedAt: Temporal.Instant | null
  isCancellable: boolean
  /**
   * It replaced a marking whose clauses a run had taken (`12r`): an editor-in-chief's step, so it
   * stays out of the proofreaders' queue, and its cancel brings that marking back (`12s`).
   */
  isReplacement: boolean
  pdfFileId: string
  reviewAuthor: string | null
}

/**
 * A marking a newer one replaced (`12s`): who marked it and when, its PDF, and each author's clause
 * as it stood at that moment, a record nothing is sent, asked about or archived from any more.
 */
export type ReplacedVersion = ArticleStep & {
  authors: readonly ClauseDetail[]
  pdfFileId: string
  replacedAt: Temporal.Instant
}

export type ArticleProgress = {
  createdAt: Temporal.Instant
  /** The final version that stands; absent or `null` while there is none. */
  finalVersion?: FinalVersion | null
  /** The handover that stands, `null` while there is none or it was cancelled. */
  handover: ArticleStep | null
  proofreading: ArticleStep | null
}

/** Whether a final version stands for the article, whatever its clauses say. */
export function isMarked(state: ArticleState): boolean {
  return (
    state === 'approved' ||
    state === 'consent' ||
    state === 'error' ||
    state === 'review' ||
    state === 'revised'
  )
}

function finalVersionState(finalVersion: FinalVersion): ArticleState {
  let { clauses } = finalVersion
  if (clauses.unsent > 0 || clauses.unarchived > 0) return 'error'
  if (clauses.review > 0) return 'review'
  if (clauses.total > 0 && clauses.approved === clauses.total) {
    return finalVersion.docRevisedAt === null ? 'approved' : 'revised'
  }
  return 'consent'
}

export function articleState(
  article: Pick<ArticleProgress, 'finalVersion' | 'handover' | 'proofreading'>,
): ArticleState {
  let finalVersion = article.finalVersion ?? null
  if (finalVersion !== null) return finalVersionState(finalVersion)
  if (article.proofreading !== null) return 'proofreading'
  return article.handover === null ? 'writing' : 'handedOver'
}

/**
 * The order of the states in the articles table (`12k`, `01a`): from the farthest along to the
 * nearest the start, so what proofreaders work on comes before what waits for them and what is
 * still being written. _Chyba_ and _Ke kontrole_ are not steps on the way: they sort with
 * _K souhlasu_, and the row stands among what waits for the editors-in-chief anyway (`12a`).
 */
export const STATE_ORDER: Readonly<Record<ArticleState, number>> = {
  approved: 0,
  consent: 1,
  error: 1,
  handedOver: 3,
  proofreading: 2,
  review: 1,
  revised: 0,
  writing: 4,
}

/**
 * The tones of `01a` this state can take: grey nobody waits, blue in progress, amber waits on the
 * editors-in-chief, red a problem, green done.
 */
export type ArticleStateTone = 'done' | 'neutral' | 'problem' | 'running' | 'waiting'

/**
 * _souhlas N z M autorů_ (`01a`): _ze_ where the number's genitive starts with _s_ or _č_ in
 * speech (_ze dvou_, _ze šesti_), _autora_ for one. Written for the one to ten authors an article
 * may have (`docs/copy-context.md`), not as a rule of Czech declension.
 */
export function consentLine(agreed: number, total: number): string {
  let preposition = [2, 3, 4, 6, 7].includes(total) ? 'ze' : 'z'
  return `souhlas ${agreed} ${preposition} ${total} ${total === 1 ? 'autora' : 'autorů'}`
}

/** The address where Google gave no name: the app knows nothing else of the person. */
export function whoOf(step: Pick<ArticleStep, 'email' | 'name'>): string {
  return step.name ?? step.email
}

/**
 * A marked article's tag (`01a`). An e-mail that did not go wins over an archive that failed: it
 * waits on the editors-in-chief, the archive only on the next run. The lines under _Schváleno_ and
 * under a failed archive are the copywriter's (`ey9bfcxx`): the job that fills the podklady pro
 * tisk still reads only the sheets, so an article of the app is never in them yet, and the line
 * says where its proof is instead, as for artworks (`13f`).
 */
function finalVersionTag(finalVersion: FinalVersion): {
  detail: string
  label: string
  tone: ArticleStateTone
} {
  let { clauses } = finalVersion
  switch (finalVersionState(finalVersion)) {
    case 'error':
      return {
        detail: clauses.unsent > 0 ? 'e-mail se nedoručil' : 'konverzace se neuložila',
        label: 'Chyba',
        tone: 'problem',
      }
    case 'review':
      return {
        detail: `Jiná odpověď · ${finalVersion.reviewAuthor ?? ''}`,
        label: 'Ke kontrole',
        tone: 'waiting',
      }
    case 'approved':
      return { detail: tied`konverzace v Licencích`, label: 'Schváleno', tone: 'done' }
    /* The day of the newest revision, a fact like its neighbours' lines; the step is the button
       beside it (`01a`, `znor6hp8`). */
    case 'revised':
      return {
        detail: `poslední úprava ${formatDayMonth(finalVersion.docRevisedAt ?? finalVersion.at)}`,
        label: 'Upraveno po schválení',
        tone: 'problem',
      }
    default: {
      let detail =
        clauses.pending > 0
          ? 'e-mail autorům čeká na odeslání'
          : clauses.waiting === 0 && clauses.verified > 0
            ? 'souhlas zaznamenán'
            : consentLine(clauses.approved, clauses.total)
      return { detail, label: 'K souhlasu', tone: 'running' }
    }
  }
}

/** The article's tag in the detail (`12a`) and the one fact under it (`01a`). */
export function articleStateTag(article: ArticleProgress): {
  detail: string
  label: string
  tone: ArticleStateTone
} {
  let finalVersion = article.finalVersion ?? null
  if (finalVersion !== null) return finalVersionTag(finalVersion)
  if (article.proofreading !== null) {
    return {
      detail: `od ${formatDayMonth(article.proofreading.at)} · ${whoOf(article.proofreading)}`,
      label: 'Korektura',
      tone: 'running',
    }
  }
  /* Only the date: the line answers how long it has waited, and an editor-in-chief always
     hands over (`12l`). */
  if (article.handover !== null) {
    return {
      detail: `od ${formatDayMonth(article.handover.at)}`,
      label: 'Dopsáno',
      tone: 'running',
    }
  }
  return {
    detail: `založen ${formatDayMonth(article.createdAt)}`,
    label: 'Píše se',
    tone: 'neutral',
  }
}

/** The line under an article's name in the detail (`12a`): its authors. */
export function authorsLine(authors: readonly Pick<Author, 'name'>[]): string {
  return authors.map((author) => author.name).join(', ')
}

/**
 * `_meta.json` in the article folder, in the scripts' shape: the artwork upload reads these keys. An issue in the app has no Evidence spreadsheet, so `sheetId` is `null`.
 */
export function articleMeta(article: {
  articleFolderId: string
  articleName: string
  authors: readonly Author[]
  docId: string
  issue: string
  issueFolderId: string
}): string {
  return JSON.stringify({
    docId: article.docId,
    articleName: article.articleName,
    issue: article.issue,
    articleFolderId: article.articleFolderId,
    issueFolderId: article.issueFolderId,
    sheetId: null,
    authors: article.authors.map((author) => ({
      authorName: author.name,
      authorEmail: author.email,
      authorSignature: author.name,
    })),
  })
}

/** The placeholder the template's body carries for the article's name, as the script replaces it. */
export const ARTICLE_NAME_PLACEHOLDER_IN_TEMPLATE = '{{NAZEV_CLANKU}}'

export const META_FILE_NAME = '_meta.json'

export function documentUrl(docId: string): string {
  return `https://docs.google.com/document/d/${encodeURIComponent(docId)}/edit`
}
