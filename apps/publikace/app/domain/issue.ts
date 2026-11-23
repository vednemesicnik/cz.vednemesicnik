/**
 * Issues (_vydání_): their states, the rules a name follows, and the words `11a`–`11e`, `12a`,
 * `12c` and `12i` give them.
 *
 * Pure, so the rules and the sentences are tested here rather than through Drive.
 */

import { shortAccount } from './drive-account.ts'
import { formatDate, formatDayMonth, pragueYear } from './time.ts'
import { tied } from './public/typography.ts'

/**
 * How many of an issue's articles or artworks there are, and how many of them are _Schváleno_
 * (`01a`, `01b`): the overview's count and the line under it (`11a`).
 */
export type ApprovedCount = { approved: number; total: number }

/** The three folders an issue has on the shared drive, in the order they are created. */
export type FolderKind = 'issue' | 'articles' | 'print'

export const FOLDER_KINDS: readonly FolderKind[] = ['issue', 'articles', 'print']

/** The names of the two folders inside the issue folder, as the script has always made them. */
export const ARTICLES_FOLDER_NAME = 'Články'
export const PRINT_FOLDER_NAME = '_Podklady_pro_tisk'

export type Issue = {
  closedAt: Temporal.Instant | null
  completedAt: Temporal.Instant | null
  /** The issue's Evidence, which the record queue creates once the issue is complete (#111). */
  evidenceSpreadsheetId: string | null
  folderIds: Record<FolderKind, string | null>
  id: number
  name: string
  startedAt: Temporal.Instant
  startedByEmail: string
  startedByName: string
}

/** `01c`. _Nedokončené_ is a state of its own, not an error (`dkssdpyc`). */
export type IssueState = 'active' | 'closed' | 'unfinished'

export function issueState(issue: Pick<Issue, 'closedAt' | 'completedAt'>): IssueState {
  if (issue.closedAt !== null) return 'closed'
  return issue.completedAt === null ? 'unfinished' : 'active'
}

export const STATE_LABELS: Record<IssueState, string> = {
  active: 'Aktivní',
  closed: 'Uzavřené',
  unfinished: 'Nedokončené',
}

/** The folders an unfinished issue still lacks, in the order _Dokončit vydání_ creates them. */
export function missingFolders(issue: Pick<Issue, 'folderIds'>): FolderKind[] {
  return FOLDER_KINDS.filter((kind) => issue.folderIds[kind] === null)
}

/**
 * `?state=` of the overview (`11a`). _Neuzavřené_ is `open`, so the code never filters by the
 * state _Aktivní_: the filter includes the unfinished issue, which is not active (`kj20mhjv`).
 */
export type IssueFilter = 'all' | 'closed' | 'open'

export function parseIssueFilter(value: string | null): IssueFilter {
  return value === 'open' || value === 'closed' ? value : 'all'
}

/**
 * The filter as the query of an address that leads back to the overview: nothing for `all`,
 * the default filter (`11a`), so the address of an unfiltered overview stays `/`.
 */
export function issueFilterSearch(filter: IssueFilter): string {
  return filter === 'all' ? '' : `?state=${filter}`
}

export function isInFilter(state: IssueState, filter: IssueFilter): boolean {
  if (filter === 'all') return true
  return filter === 'closed' ? state === 'closed' : state !== 'closed'
}

export const FILTER_LABELS: Record<IssueFilter, string> = {
  all: 'Vše',
  closed: 'Uzavřené',
  open: 'Neuzavřené',
}

const MAX_NAME_LENGTH = 100

/**
 * What a duplicate is judged by: case and the spaces around the name do not count, as in the
 * script (`11d`), and neither does how a pasted accent was encoded.
 */
export function issueNameKey(name: string): string {
  return name.normalize('NFC').trim().toLowerCase()
}

export type NameCheck = { message: string; ok: false } | { name: string; ok: true }

export const EMPTY_NAME_MESSAGE = 'Vyplňte název vydání.'
export const LONG_NAME_MESSAGE = 'Zkraťte název na nejvýš 100 znaků.'

/**
 * The field's own rules. The form `VDM_RRRR_N` is a hint and never a rule: a special issue may
 * be called otherwise, and the suggested number keeps the form by itself (`11d`).
 */
export function checkIssueName(value: string): NameCheck {
  let name = value.normalize('NFC').trim()
  if (name === '') return { message: EMPTY_NAME_MESSAGE, ok: false }
  if ([...name].length > MAX_NAME_LENGTH) return { message: LONG_NAME_MESSAGE, ok: false }
  return { name, ok: true }
}

export function duplicateNameMessage(existingName: string): string {
  return tied`Zvolte jiný název — vydání ${existingName} už v aplikaci existuje.`
}

const NUMBERED_NAME = /^VDM_(\d{4})_(\d+)$/i

/**
 * The name the dialog offers: one above the last issue of this year, `VDM_<year>_1` in a new
 * year. Empty when no issue the app knows is numbered, typically the first one after the app
 * starts: the number lives in the sheets, and `VDM_2026_1` would be wrong (`11d`).
 */
export function suggestNextName(names: readonly string[], today: Temporal.Instant): string {
  let year = pragueYear(today)
  let isAnyNumbered = false
  let highest = 0

  for (let name of names) {
    let match = NUMBERED_NAME.exec(name.trim())
    if (match === null) continue
    isAnyNumbered = true
    if (Number(match[1]) === year) highest = Math.max(highest, Number(match[2]))
  }

  return isAnyNumbered ? `VDM_${year}_${highest + 1}` : ''
}

/**
 * The dialog's text (`11d`). Without a Registr its middle sentence names only
 * the Evidence and says nothing of the Registr, since the editors can do nothing about it here and
 * Soubory na Disku says it where the Registr is looked for (`14j`).
 */
export function newIssueText(hasRegistry: boolean): string {
  let record = hasRegistry
    ? tied`Evidence a záznam v Registru vzniknou až po vytvoření vydání.`
    : tied`Evidence vznikne až po vytvoření vydání.`
  return `${tied`Na sdíleném disku Publikace vznikne složka vydání se složkami Články a podklady pro tisk.`} ${record} ${tied`Odkaz pro redakci na nový článek bude v detailu vydání.`}`
}

export const NAME_HINT = 'Ve tvaru VDM_RRRR_N.'

/** In the dialog from the moment it opens, while the account was never connected (`14g`). */
export function notConnectedDialogMessage(expectedEmail: string): string {
  return tied`Nejdřív v Nastavení připojte účet ${shortAccount(expectedEmail)}, aby šlo vytvořit vydání.`
}

/** _Dokončit vydání_ while the account was never connected (`14g`). */
export function notConnectedToast(expectedEmail: string): string {
  return tied`Nejdřív v Nastavení připojte účet ${shortAccount(expectedEmail)}.`
}

/* `11c`: Drive did not answer at the issue folder, so nothing exists. */
export const CREATE_UNAVAILABLE_TITLE = 'Zkuste vytvořit vydání za chvíli znovu'
export const CREATE_UNAVAILABLE_TEXT = 'Nic se nevytvořilo. Disk teď neodpovídá.'

export function unfinishedTitle(name: string): string {
  return `Vydání ${name} není dokončené`
}

const FOLDER_LABELS: Record<Exclude<FolderKind, 'issue'>, string> = {
  articles: 'Články',
  print: 'podklady pro tisk',
}

/**
 * The step and what is missing, naming only what this issue lacks (`11d`, `12i`). The issue
 * folder is missing only when the process stopped between writing the row and creating it; then
 * everything is missing and the clause about the issue folder would not be true.
 */
export function unfinishedText(missing: readonly FolderKind[]): string {
  if (missing.includes('issue')) {
    return tied`Zvolte Dokončit vydání. Doplní se chybějící složky vydání, Články a podklady pro tisk.`
  }

  let labels = missing.filter((kind) => kind !== 'issue').map((kind) => FOLDER_LABELS[kind])
  /* Every folder stored and the issue still unfinished: the process stopped just before the
     last step, and finishing only records it. */
  if (labels.length === 0) return 'Zvolte Dokončit vydání.'
  let what =
    labels.length === 1
      ? `chybějící složka ${labels[0]}`
      : `chybějící složky ${labels.join(tied` a `)}`
  return `Zvolte Dokončit vydání. Doplní se ${what}; složka vydání už vznikla.`
}

/* As drawn (`11d`), the link included. */
export function createdToast(name: string): string {
  return `Vydání ${name} je založené. Použijte Odkaz pro redakci.`
}

export function finishedToast(name: string): string {
  return `Vydání ${name} je dokončené.`
}

export const FINISH_UNAVAILABLE_TOAST = 'Zkuste dokončit vydání za chvíli znovu.'

/** `12i`: the stored issue folder is no longer on Drive, so finishing would create it twice. */
export function folderGoneMessage(name: string): string {
  return tied`Obnovte složku vydání ${name} z koše, nebo ji vraťte na sdílený disk Publikace. Pak zvolte Dokončit vydání.`
}

/**
 * The line under the name in the overview. _Založení zahájeno_ for an unfinished issue,
 * because _založeno_ would promise a finished start (`kj20mhjv`).
 */
export function rowSubtitle(issue: Issue): string {
  let state = issueState(issue)
  if (state === 'closed' && issue.closedAt !== null) return `uzavřeno ${formatDate(issue.closedAt)}`
  let verb = state === 'unfinished' ? 'založení zahájeno' : 'založeno'
  return `${verb} ${formatDate(issue.startedAt)}`
}

/** `Založeno 3. 11. 2026 · Marie Horáková`, under the detail's title (`12a`, `12i`). */
export function detailStartedLine(issue: Issue): string {
  let verb = issueState(issue) === 'unfinished' ? 'Založení zahájeno' : 'Založeno'
  return `${verb} ${formatDate(issue.startedAt)} · ${issue.startedByName}`
}

/** `0 článků`, `1 článek`, `3 články`. */
export function articleCount(count: number): string {
  return `${count} ${czechPlural(count, 'článek', 'články', 'článků')}`
}

/** `0 děl`, `1 dílo`, `3 díla`. */
export function artworkCount(count: number): string {
  return `${count} ${czechPlural(count, 'dílo', 'díla', 'děl')}`
}

function czechPlural(count: number, one: string, few: string, many: string): string {
  if (count === 1) return one
  return count >= 2 && count <= 4 ? few : many
}

/* `12g`, `12h`: closing and reopening an issue, from the detail's „⋯“ and the overview row's. */
export const CLOSE_ISSUE_LABEL = 'Uzavřít vydání…'
export const REOPEN_ISSUE_LABEL = 'Znovu otevřít vydání…'
export const OPEN_FOLDER_LABEL = 'Otevřít složku na Disku'
export const OPEN_PRINT_FOLDER_LABEL = 'Otevřít podklady pro tisk'
/* `12a`, `12h`: first in the detail's „⋯“ once the record queue created it (#111). */
export const OPEN_EVIDENCE_LABEL = 'Otevřít Evidenci'

export function closeDialogTitle(name: string): string {
  return `Uzavřít vydání ${name}?`
}

/* `12g`: closing changes nothing on Drive, its sharing included (`03` row 8). Every file and
   folder of the issue inherits the issues folder's link grant, and only a Manager of the shared
   drive could cut it, which `publikace.app@` is not. The note says so with _sdílení_ rather than
   _odkazy_, so that _odkaz_ stays the editors' link of the first sentence (answer `51yfpl63`). */
export const CLOSE_DIALOG_TEXT = tied`Odkazy pro redakci přestanou platit a úlohy na pozadí vydání přeskočí.`
export const CLOSE_DIALOG_NOTE = tied`Soubory i složky na Disku zůstanou a jejich sdílení se nezmění. Vydání jde kdykoli znovu otevřít.`
export const CLOSE_CONFIRM_LABEL = 'Uzavřít vydání'
export const CLOSE_ANYWAY_LABEL = 'Přesto uzavřít'

/**
 * The warning of `12g` while articles or artworks still lack consent, or `null` when nothing
 * does: _U 2 článků a 3 děl zatím chybí souhlas._ The counts stand in the genitive, so no verb
 * has to agree with them.
 *
 * The drawn _a do podkladů se nedostanou_ is left out while the print job runs nowhere (#119):
 * until it does, nothing of an issue made in the app reaches the print folder, closed or not, so
 * closing would be blamed for something it does not cause.
 */
export function closeWarningText(articles: number, artworks: number): string | null {
  if (articles === 0 && artworks === 0) return null
  let counts = [
    ...(articles === 0 ? [] : [`${articles} ${articles === 1 ? 'článku' : 'článků'}`]),
    ...(artworks === 0 ? [] : [`${artworks} ${artworks === 1 ? 'díla' : 'děl'}`]),
  ]
  return tied`U ${counts.join(tied` a `)} zatím chybí souhlas. Dokud je vydání uzavřené, aplikace neodesílá žádosti o souhlas ani nečte odpovědi.`
}

export function reopenDialogTitle(name: string): string {
  return `Znovu otevřít ${name}?`
}

export const REOPEN_DIALOG_TEXT = tied`Původní odkazy pro redakci začnou znovu platit a úlohy na pozadí vydání zase zpracují.`
export const REOPEN_CONFIRM_LABEL = 'Znovu otevřít'

/** The Callout over a closed issue's detail (`12h`), with _Znovu otevřít_ under it. */
export function closedCalloutText(closedAt: Temporal.Instant): string {
  return tied`Vydání je uzavřené od ${formatDate(closedAt)}. Odkazy neplatí, úlohy ho přeskakují.`
}

/** Under the struck-through link of a closed issue (`12h`). */
export const CLOSED_LINK_META = tied`Neplatí od uzavření`

/* Not drawn: after `finishedToast`, through `/ask-copy`. */
export function closedToast(name: string): string {
  return `Vydání ${name} je uzavřené.`
}

export function reopenedToast(name: string): string {
  return `Vydání ${name} je znovu otevřené.`
}

/**
 * The second line of a row on a phone, where the counts stand in one line (`11e`). An open
 * issue ends in what waits on the editors, in the ink of _Čeká na vás_, or in _vše schválené_
 * once there is nothing left to approve; `tail` is that end, apart so the page can ink it.
 */
export function phoneRowLine(
  issue: Issue,
  counts: { articles: ApprovedCount; artworks: ApprovedCount; waiting: number },
): { tail: { isWaiting: boolean; text: string } | null; text: string } {
  let state = issueState(issue)
  if (state === 'unfinished') return { tail: null, text: rowSubtitle(issue) }
  let { articles, artworks, waiting } = counts
  let text = `${articleCount(articles.total)} · ${artworkCount(artworks.total)}`
  if (state === 'closed' && issue.closedAt !== null) {
    return { tail: null, text: `${text} · uzavřeno ${formatDayMonth(issue.closedAt)}` }
  }
  if (waiting > 0) return { tail: { isWaiting: true, text: waitingText(waiting) }, text }
  let isAllApproved =
    articles.total + artworks.total > 0 &&
    articles.approved === articles.total &&
    artworks.approved === artworks.total
  return { tail: isAllApproved ? { isWaiting: false, text: 'vše schválené' } : null, text }
}

/* `11e` draws `5 čeká na vás`; the verb agrees with the number, `2 čekají na vás`. */
function waitingText(count: number): string {
  return `${count} ${count >= 2 && count <= 4 ? 'čekají' : 'čeká'} na vás`
}

export const EMPTY_TITLE = 'Zatím tu není žádné vydání'
export const EMPTY_TEXT = tied`Založte první vydání v aplikaci. Vydání z doby před aplikací dál dokončujte v původních tabulkách.`

export function emptyFilterTitle(filter: Exclude<IssueFilter, 'all'>): string {
  return filter === 'closed' ? 'Žádné uzavřené vydání' : 'Žádné neuzavřené vydání'
}

/** _Vydání_ does not decline with a number: 1, 2 and 5 _vydání_ alike. */
export function otherFilterText(count: number): string {
  return `Filtr Vše ukáže ${count} vydání.`
}

/* `12c`, the sections of a fresh issue. */
export const ARTICLES_EMPTY_TEXT =
  'Zatím žádný článek. Pošlete redakci odkaz nahoře, články se tu objeví hned po založení.'
export const ARTWORKS_EMPTY_TEXT = tied`Díla nahrají autoři odkazem z uvítacího e-mailu, nebo poskytovatelé odkazem ke skupině.`

/* `12i`: where the link will stand, without the link, so nobody copies it before it is valid. */
export const LINK_PLACEHOLDER_TEXT = 'Odkaz na nový článek bude tady, až bude vydání dokončené.'

/** The folder on Drive, for _Složka na Disku_ and _Otevřít složku na Disku_. */
export function folderUrl(folderId: string): string {
  return `https://drive.google.com/drive/folders/${encodeURIComponent(folderId)}`
}
