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

/**
 * A Callout of either dialog: the step as its heading, an optional list of links under it, and
 * what came of it.
 */
export type FixCallout = {
  list?: { href: string; text: string }[]
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

/** A file the app did not make, and the folder it is in. */
export type ForeignFile = NamedTarget & { folderName: string }

/**
 * Files a person put into the issue's folders (`12w`): a sentence for each folder, at most three
 * files named across all of them, then _a ‹n› dalších_.
 */
export function foreignFilesCallout(files: readonly ForeignFile[]): FixCallout {
  let shown = files.slice(0, 3)
  let folders = [...new Set(shown.map((file) => file.folderName))]
  let text: CalloutPart[] = []
  folders.forEach((folderName, folderIndex) => {
    let inFolder = shown.filter((file) => file.folderName === folderName)
    let isLast = folderIndex === folders.length - 1
    text.push(`${folderIndex > 0 ? ' ' : ''}Ve složce „${folderName}“: `)
    inFolder.forEach((file, index) => {
      if (index > 0) {
        let isLastNamed = index === inFolder.length - 1 && !(isLast && files.length > 3)
        text.push(isLastNamed ? tied` a ` : ', ')
      }
      text.push({ href: file.href, text: file.name })
    })
    if (isLast && files.length > 3) text.push(tied` a ${files.length - 3} dalších`)
    text.push('.')
  })
  text.push(` ${ISSUE_UNCHANGED}`)
  return {
    text,
    title: [tied`Přesuňte ze složky vydání soubory, které do ní nedala aplikace.`],
  }
}
