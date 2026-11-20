/**
 * Issues (_vydání_): their states, the rules a name follows, and the words `11a`–`11e`, `12a`,
 * `12c` and `12i` give them.
 *
 * Pure, so the rules and the sentences are tested here rather than through Drive.
 */

import { shortAccount } from './drive-account.ts'
import { formatDate, formatDayMonth, pragueYear } from './time.ts'
import { tied } from './public/typography.ts'

/** The three folders an issue has on the shared drive, in the order they are created. */
export type FolderKind = 'issue' | 'articles' | 'print'

export const FOLDER_KINDS: readonly FolderKind[] = ['issue', 'articles', 'print']

/** The names of the two folders inside the issue folder, as the script has always made them. */
export const ARTICLES_FOLDER_NAME = 'Články'
export const PRINT_FOLDER_NAME = '_Podklady_pro_tisk'

export type Issue = {
  closedAt: Temporal.Instant | null
  completedAt: Temporal.Instant | null
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

/* `11d`, as drawn, the Evidence, the Registr and the link included. */
export const NEW_ISSUE_TEXT = tied`Na sdíleném disku Publikace vznikne složka vydání se složkami Články a podklady pro tisk. Evidence a záznam v Registru se doplní následně. Odkaz pro redakci na nový článek bude v detailu vydání.`

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

/** The second line of a row on a phone, where the counts stand in one line (`11e`). */
export function phoneRowLine(issue: Issue, articles: number, artworks: number): string {
  let state = issueState(issue)
  if (state === 'unfinished') return rowSubtitle(issue)
  let counts = `${articleCount(articles)} · ${artworkCount(artworks)}`
  if (state === 'closed' && issue.closedAt !== null) {
    return `${counts} · uzavřeno ${formatDayMonth(issue.closedAt)}`
  }
  return counts
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
