/**
 * Mending a mistake made in creating an issue (#151): _Přejmenovat vydání…_ (`12v`) and _Odebrat
 * vydání…_ (`12w`), where each stands (`12u`) and every word of both dialogs. The wording is the
 * copywriter's (`ggqtf0xy`, `34f11ror`), drawn in `786r4cpa`, `glcs8cga` and `2qzhntrn`.
 *
 * Pure, so the rules and the sentences are tested here rather than through Drive.
 */

import { type Issue, type IssueState, issueState } from './issue.ts'
import { tied } from './public/typography.ts'

export const RENAME_ISSUE_LABEL = 'Přejmenovat vydání…'
export const REMOVE_ISSUE_LABEL = 'Odebrat vydání…'

/** What an issue holds, as its row counts it: created articles and created groups. */
export type IssueContents = { articles: number; groups: number }

/**
 * An active or unfinished issue (`12u`). A closed one is read only (`12h`) and is renamed once it
 * is open again.
 */
export function canRename(issue: Pick<Issue, 'closedAt' | 'completedAt'>): boolean {
  return issueState(issue) !== 'closed'
}

/**
 * An issue with no article and no group, in any state (`12u`). A batch always belongs to one of
 * them, so an empty issue has none.
 */
export function canRemove(contents: IssueContents): boolean {
  return contents.articles === 0 && contents.groups === 0
}

/** A piece of a Callout's sentence: plain text, or a link to Drive in a new tab. */
export type CalloutPart = string | { href: string; text: string }

/** A link on its own line of a Callout's list. */
export type CalloutLink = { href: string; text: string }

/** One place of a list over several places: the line that names it, and its links under it. */
export type CalloutGroup = { lead: CalloutPart[]; list: CalloutLink[] }

/**
 * A Callout of either dialog: the step as its heading, an optional list of links under it, either
 * flat or split by place, and what came of it.
 */
export type FixCallout = {
  groups?: CalloutGroup[]
  list?: CalloutLink[]
  text: CalloutPart[]
  title: CalloutPart[]
}

const NOTHING_CHANGED = 'Nic se nezměnilo.'
const ISSUE_UNCHANGED = 'Vydání zůstalo, jak bylo.'

/* ---------- Přejmenovat vydání (`12v`) ---------- */

export const RENAME_DIALOG_TITLE = 'Přejmenovat vydání'
export const RENAME_CONFIRM_LABEL = 'Přejmenovat vydání'
export const RENAME_PENDING_LABEL = 'Vydání se přejmenovává…'
export const RENAMED_TOAST = 'Vydání i jeho složka jsou přejmenované.'
export const RENAMED_MEANWHILE_TOAST = tied`Vydání se mezitím přejmenovalo. Vaše změna se neuložila.`

/**
 * The two paragraphs above the field. The sentence about the record stands only where the record
 * changes: the Registr holds the name of a complete issue, and the Evidence never does
 * (`glcs8cga`).
 */
export function renameDialogText(state: IssueState, hasRegistry: boolean): [string, string] {
  let folder = tied`Přejmenuje se i složka vydání na sdíleném disku Publikace.`
  let record = tied`Nový název vydání se v Registru může objevit později.`
  return [
    state === 'active' && hasRegistry ? `${folder} ${record}` : folder,
    tied`Odkazy pro redakci i odkazy na nahrání děl platí dál. Nikomu se nic nepošle a e-maily, které už odešly, nesou dosavadní název.`,
  ]
}

export function renameClosedToast(name: string): string {
  return tied`Vydání ${name} je uzavřené. Přejmenovat ho už nejde.`
}

export const RENAME_UNAVAILABLE: FixCallout = {
  text: [tied`${NOTHING_CHANGED} Disk teď neodpovídá.`],
  title: [tied`Zkuste vydání přejmenovat za chvíli znovu.`],
}

export const RENAME_DISCONNECTED: FixCallout = {
  text: [NOTHING_CHANGED],
  title: [tied`Nejdřív v Nastavení připojte účet publikace.app@vednemesicnik.cz.`],
}

export const RENAME_ISSUE_FOLDER_MISSING: FixCallout = {
  text: [NOTHING_CHANGED],
  title: [tied`Obnovte složku vydání z koše, nebo ji vraťte na sdílený disk Publikace.`],
}

/**
 * `Články` itself missing, which `12v` does not draw: the step `12j` gives it, and nothing
 * changed. The articles' folders are in it, so they are not named one by one.
 */
export function renameArticlesFolderMissing(name: string): FixCallout {
  return {
    text: [NOTHING_CHANGED],
    title: [
      tied`Obnovte složku Články vydání ${name} z koše, nebo ji vraťte na sdílený disk Publikace.`,
    ],
  }
}

/** A folder or a file the rename needs, named by what it belongs to and linked by its ID. */
export type NamedTarget = { href: string; name: string }

/**
 * The names in a sentence of one kind: up to three all of them, from four the first two and
 * _a ‹n› dalších_, where n is at least 2 and so reads in the genitive (`34f11ror`).
 */
function namesOf(targets: readonly NamedTarget[]): CalloutPart[] {
  let quoted = (target: NamedTarget): CalloutPart[] => [
    '„',
    { href: target.href, text: target.name },
    '“',
  ]
  let shown = targets.length <= 3 ? targets : targets.slice(0, 2)
  let parts: CalloutPart[] = []
  shown.forEach((target, index) => {
    if (index > 0) parts.push(index === shown.length - 1 && targets.length <= 3 ? tied` a ` : ', ')
    parts.push(...quoted(target))
  })
  if (targets.length > 3) parts.push(tied` a ${targets.length - 2} dalších`)
  return parts
}

/**
 * The folders of articles and groups a rename did not find (`12v`, `2qzhntrn`): one Callout for
 * all of them, articles first. Both kinds at once name the first of each, and the detail shows the
 * rest under their rows (`12j`).
 */
export function missingFoldersCallout(
  articles: readonly NamedTarget[],
  groups: readonly NamedTarget[],
): FixCallout {
  let first = articles[0]
  let firstGroup = groups[0]
  if (first !== undefined && firstGroup !== undefined) {
    let isMore = articles.length + groups.length > 2
    return {
      text: [
        `${isMore ? `${tied`Další chybějící složky najdete v detailu vydání.`} ` : ''}${tied`K přejmenování vydání jsou potřeba složky všech článků a skupin obrazových děl.`} ${NOTHING_CHANGED}`,
      ],
      title: [
        'Obnovte složky článku „',
        { href: first.href, text: first.name },
        tied`“ a skupiny „`,
        { href: firstGroup.href, text: firstGroup.name },
        tied`“ z koše, nebo je vraťte na sdílený disk Publikace.`,
      ],
    }
  }

  let isArticles = articles.length > 0
  let targets = isArticles ? articles : groups
  let isOne = targets.length === 1
  let what = isArticles
    ? isOne
      ? 'složku článku '
      : 'složky článků '
    : isOne
      ? 'složku skupiny '
      : 'složky skupin '
  return {
    text: [
      `${isArticles ? tied`K přejmenování vydání jsou potřeba složky všech článků.` : tied`K přejmenování vydání jsou potřeba složky všech skupin obrazových děl.`} ${NOTHING_CHANGED}`,
    ],
    title: [
      `Obnovte ${what}`,
      ...namesOf(targets),
      isOne
        ? tied` z koše, nebo ji vraťte na sdílený disk Publikace.`
        : tied` z koše, nebo je vraťte na sdílený disk Publikace.`,
    ],
  }
}

/** A `_meta.json` in the bin, named by what it belongs to; the file's own name never shows. */
export type BinnedFile = NamedTarget & { kind: 'article' | 'group' }

function fileLabel(file: BinnedFile, isCapital: boolean): string {
  let start = isCapital ? 'Soubor' : 'soubor'
  return `${start} pro ${file.kind === 'article' ? 'článek' : 'skupinu'} „${file.name}“`
}

/**
 * `_meta.json` files in the bin while every folder is there (`2qzhntrn`): up to three in one
 * sentence, from four a list. Every file has its own link, because files of one name are told
 * apart only by it.
 */
export function binnedFilesCallout(files: readonly BinnedFile[]): FixCallout {
  if (files.length >= 4) {
    return {
      list: files.map((file) => ({ href: file.href, text: fileLabel(file, true) })),
      text: [NOTHING_CHANGED],
      title: [tied`Obnovte soubory z koše.`],
    }
  }
  let title: CalloutPart[] = ['Otevřete ']
  files.forEach((file, index) => {
    if (index > 0) title.push(index === files.length - 1 ? tied` a ` : ', ')
    title.push({ href: file.href, text: fileLabel(file, false) })
  })
  title.push(files.length === 1 ? tied` a obnovte ho z koše.` : tied` a obnovte je z koše.`)
  return { text: [NOTHING_CHANGED], title }
}

/* ---------- Odebrat vydání (`12w`) ---------- */

export const REMOVE_CONFIRM_LABEL = 'Odebrat vydání'
export const REMOVED_ALREADY_TOAST = 'Vydání už je odebrané.'
export const REMOVE_RACE_ARTICLE_TOAST = tied`Ve vydání mezitím vznikl článek. Vydání se neodebralo.`
export const REMOVE_RACE_GROUP_TOAST = tied`Ve vydání mezitím vznikla skupina. Vydání se neodebralo.`

export function removeDialogTitle(name: string): string {
  return `Odebrat vydání ${name}?`
}

/**
 * The dialog's paragraphs, from two conditions that do not depend on each other: the Registr
 * holds a complete issue when one is set, and only an active issue has a valid link (`12w`).
 */
export function removeDialogText(
  state: IssueState,
  hasRegistry: boolean,
  isFolderInBin: boolean,
): string[] {
  let gone =
    state !== 'unfinished' && hasRegistry
      ? tied`Vydání zmizí z přehledu i z Registru a jeho název půjde použít znovu.`
      : tied`Vydání zmizí z přehledu a jeho název půjde použít znovu.`
  return [
    isFolderInBin
      ? tied`Složka vydání už je v koši sdíleného disku Publikace.`
      : tied`Složka vydání se přesune do koše sdíleného disku Publikace i se vším, co v ní je.`,
    state === 'active' ? `${gone} ${tied`Odkaz pro redakci přestane platit.`}` : gone,
    tied`Obnovením složky z koše se vydání do aplikace nevrátí.`,
    tied`Nikomu se nic nepošle.`,
  ]
}

export function removedToast(name: string): string {
  return tied`Složka vydání ${name} je v koši sdíleného disku Publikace.`
}

export const REMOVE_UNAVAILABLE: FixCallout = {
  text: [tied`${ISSUE_UNCHANGED} Disk teď neodpovídá.`],
  title: [tied`Zkuste vydání odebrat za chvíli znovu.`],
}

export const REMOVE_DISCONNECTED: FixCallout = {
  text: [tied`Pak zkuste vydání odebrat znovu.`],
  title: [tied`Nejdřív v Nastavení připojte účet publikace.app@vednemesicnik.cz.`],
}

/** The issue folder is not where the app made it, so it stays where it is (`12w`). */
export function movedFolderCallout(folderHref: string): FixCallout {
  return {
    text: [tied`Teď je jinde, a tak vydání zůstalo, jak bylo.`],
    title: [
      'Vraťte ',
      { href: folderHref, text: 'složku vydání' },
      tied` tam, kde ji aplikace založila.`,
    ],
  }
}

/** A file the app did not make, and the folder it is in, which the Callout links to. */
export type ForeignFile = NamedTarget & { folderHref: string; folderId: string; folderName: string }

/** The words around the files: the step, and what stayed, the issue's unless an article's. */
export type ForeignFilesWords = { kept: string; step: string }

const ISSUE_FOREIGN_WORDS: ForeignFilesWords = {
  kept: ISSUE_UNCHANGED,
  step: tied`Přesuňte ze složky vydání soubory, které do ní nedala aplikace.`,
}

/* Czech order, with the numbers in a name by value, so that `navrh-2` stands before `navrh-10`. */
const BY_NAME = new Intl.Collator('cs', { numeric: true })

/**
 * The files by folder, the folders in the order they came and each one's files by name. The order
 * of the folders is the caller's: Drive answers in no order, and a file that stays in its place
 * between two attempts is easier to find than one that moved (`tw25hpbd`).
 */
function byFolder(files: readonly ForeignFile[]): ForeignFile[][] {
  let folders = new Map<string, ForeignFile[]>()
  for (let file of files) folders.set(file.folderId, [...(folders.get(file.folderId) ?? []), file])
  return [...folders.values()].map((inFolder) =>
    inFolder.toSorted((a, b) => BY_NAME.compare(a.name, b.name)),
  )
}

function folderLead(file: ForeignFile): CalloutPart[] {
  return ['Ve složce „', { href: file.folderHref, text: file.folderName }, '“:']
}

/**
 * Files a person put into the folders of an issue (`12w`), an article (`12z`) or a group (`12f`),
 * every one of them, because the removal goes through only once each is moved. Up to three
 * across all folders, a sentence for each folder; from four, a line for each folder and its files
 * under it, the design system's rule for things to mend outside the page (`2qzhntrn`,
 * `tw25hpbd`).
 */
export function foreignFilesCallout(
  files: readonly ForeignFile[],
  words: ForeignFilesWords = ISSUE_FOREIGN_WORDS,
): FixCallout {
  let folders = byFolder(files)
  if (files.length >= 4) {
    return {
      groups: folders.map((inFolder) => ({
        lead: folderLead(inFolder[0]),
        list: inFolder.map((file) => ({ href: file.href, text: file.name })),
      })),
      text: [words.kept],
      title: [words.step],
    }
  }
  let text: CalloutPart[] = []
  folders.forEach((inFolder, folderIndex) => {
    if (folderIndex > 0) text.push(' ')
    text.push(...folderLead(inFolder[0]), ' ')
    inFolder.forEach((file, index) => {
      if (index > 0) text.push(index === inFolder.length - 1 ? tied` a ` : ', ')
      text.push({ href: file.href, text: file.name })
    })
    text.push('.')
  })
  text.push(` ${words.kept}`)
  return { text, title: [words.step] }
}
