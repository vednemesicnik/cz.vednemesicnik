import { atTime, formatDayMonth } from './time.ts'

/**
 * What the article Doc's menu _Publikace_ shows after a click, as the app answers it (`12p`, and
 * the dialogs `12m` shares with it). The bound script draws whatever comes back: a heading, the
 * article, lines and buttons, all as text. Every Doc keeps the script it was copied with, so the
 * words live here, where a change reaches the Docs that exist already.
 *
 * The wording went through the copywriter (`2kwj921b`) and is the drawing's, word for word.
 */

/** How a line is drawn: plain, bold (`gdlg-u`), smaller (`meta`), or in a warning Callout. */
export type DialogLineTone = 'body' | 'small' | 'strong' | 'warning'

export type DialogLine = { text: string; tone: DialogLineTone }

export type DialogAction =
  | { kind: 'close'; label: string }
  | { kind: 'confirm'; label: string; pendingLabel: string }
  | { kind: 'open'; label: string; url: string }

/** The dialog as the script receives it. A field is never renamed: Docs out there read it. */
export type DocMenuDialog = {
  actions: DialogAction[]
  heading: string
  lines: DialogLine[]
  /** The line under the article's name: its issue, and what is known of its handover. */
  meta: string | null
  /** The article's name, in quotes, at most three lines in the window. */
  title: string | null
}

export type Proofreader = { email: string; name: string | null }

const CLOSE: DialogAction = { kind: 'close', label: 'Zavřít' }

function titleOf(articleName: string): string {
  return `„${articleName}“`
}

function whoOf(person: Proofreader): string {
  return person.name ?? person.email
}

function dialog(heading: string, lines: DialogLine[], extra: Partial<DocMenuDialog> = {}) {
  return { actions: [CLOSE], heading, lines, meta: null, title: null, ...extra }
}

/* The menu-wide dialogs: every item of the menu answers with them and changes only the sentence
   saying what did not happen (`12m`, `12p`). */

/** A copy of an article's Doc, known for certain by the `_meta.json` it carries. */
export function copyDialog(
  original: { articleName: string; documentUrl: string; issueName: string },
  instead: string,
): DocMenuDialog {
  return dialog(
    'Toto je kopie dokumentu článku',
    [
      { text: instead, tone: 'body' },
      { text: 'Změny z kopie se do původního dokumentu samy nepřenesou.', tone: 'body' },
    ],
    {
      actions: [CLOSE, { kind: 'open', label: 'Otevřít původní', url: original.documentUrl }],
      meta: original.issueName,
      title: titleOf(original.articleName),
    },
  )
}

/** A Doc the app does not know, whose original may not exist at all. */
export function unknownDocumentDialog(result: string): DocMenuDialog {
  return dialog('Publikace tento dokument nezná', [
    { text: 'Pošlete šéfredakci odkaz na tento dokument.', tone: 'body' },
    { text: result, tone: 'small' },
  ])
}

/**
 * An account the app does not accept: its token did not verify, or it may not edit the Doc. It
 * says nothing of the article, not even whether the app knows the Doc.
 */
export function refusedAccountDialog(result: string): DocMenuDialog {
  return dialog('Publikace váš účet nepřijala', [
    {
      text: 'Napište šéfredakci, který účet Google používáte pro tento dokument. Uveďte jeho e-mailovou adresu.',
      tone: 'body',
    },
    { text: result, tone: 'small' },
  ])
}

/* _Označit probíhající korekturu_ (`12p`). */

export const PROOFREADING_COPY_SENTENCE = 'Pro označení korektury otevřete původní dokument.'
export const PROOFREADING_UNKNOWN_RESULT = 'Korekturu v něm označit nejde.'
export const PROOFREADING_REFUSED_RESULT = 'Při tomto pokusu se korektura neoznačila.'

/**
 * The confirmation, for an article nobody has marked. The account is shown so that somebody
 * signed in to the wrong one sees it before anything is recorded, and the step cannot be taken
 * back by anyone (`01d`). An article not yet handed over warns that it can no longer be.
 */
export function confirmProofreadingDialog(article: {
  account: Proofreader
  articleName: string
  issueName: string
}): DocMenuDialog {
  return {
    actions: [
      { kind: 'close', label: 'Zrušit' },
      { kind: 'confirm', label: 'Označit', pendingLabel: 'Označování…' },
    ],
    heading: 'Označit probíhající korekturu?',
    lines: [
      { text: 'Šéfredakce v Publikaci uvidí, kdo dělá korekturu.', tone: 'body' },
      { text: `Účet pro korekturu: ${whoOf(article.account)}`, tone: 'strong' },
      {
        text: 'Po označení už článek nepůjde předat ke korektuře a korektorům neodejde e-mail.',
        tone: 'warning',
      },
      { text: 'Označení nelze vzít zpět.', tone: 'body' },
    ],
    meta: `${article.issueName} · Ke korektuře zatím nepředáno`,
    title: titleOf(article.articleName),
  }
}

export function proofreadingMarkedDialog(): DocMenuDialog {
  return dialog('Korektura označena', [
    { text: 'Šéfredakce teď v Publikaci vidí, kdo dělá korekturu.', tone: 'body' },
  ])
}

/** A second click, by the same person or another: who marked it and when, and nothing written. */
export function alreadyProofreadDialog(record: Proofreader & { at: Temporal.Instant }) {
  return dialog('Korektura už je označená', [
    {
      text: `Označeno ${formatDayMonth(record.at)} ${atTime(record.at)} · ${whoOf(record)}`,
      tone: 'strong',
    },
    { text: 'Nic se nezměnilo.', tone: 'body' },
  ])
}

export function closedIssueDialog(issueName: string): DocMenuDialog {
  return dialog(`Vydání ${issueName} je uzavřené`, [
    { text: 'Korekturu teď označit nejde.', tone: 'body' },
  ])
}

/** What the app knows of the Doc the click came from, once the account has been accepted. */
export type ProofreadingTarget =
  | { kind: 'unknown' }
  | { articleName: string; documentUrl: string; issueName: string; kind: 'copy' }
  | {
      articleName: string
      isIssueClosed: boolean
      issueName: string
      kind: 'article'
      proofreading: (Proofreader & { at: Temporal.Instant }) | null
    }

/**
 * The answer to one click, in the order `12p` decides it: the account, the Doc, the issue, the
 * article's state. The account comes first so that nobody refused learns even whether the app
 * knows the Doc. `record` is the one case that writes, and only when the click confirms.
 */
export function decideProofreading(input: {
  account: Proofreader | null
  isConfirmed: boolean
  target: ProofreadingTarget
}): DocMenuDialog | { kind: 'record' } {
  let { account, target } = input
  if (account === null) return refusedAccountDialog(PROOFREADING_REFUSED_RESULT)
  if (target.kind === 'unknown') return unknownDocumentDialog(PROOFREADING_UNKNOWN_RESULT)
  if (target.kind === 'copy') return copyDialog(target, PROOFREADING_COPY_SENTENCE)
  if (target.isIssueClosed) return closedIssueDialog(target.issueName)
  if (target.proofreading !== null) return alreadyProofreadDialog(target.proofreading)
  if (input.isConfirmed) return { kind: 'record' }
  return confirmProofreadingDialog({ account, ...target })
}
