/**
 * Mending an artwork group made wrong (#154): _Upravit název a poznámku…_ and _Odebrat skupinu…_
 * (`12f`), where each stands (`12u`) and every word of both dialogs. The edit's wording is the
 * copywriter's (`38hm36x7`) and the removal's (`ggqtf0xy`), both drawn in `12f` (`iuepzv2t`,
 * `786r4cpa`).
 *
 * Pure, so the rules and the sentences are tested here rather than through Drive.
 */

import { groupNameKey } from './artwork-group.ts'
import {
  type CalloutPart,
  type FixCallout,
  type ForeignFile,
  type ForeignFilesWords,
  foreignFilesCallout,
} from './issue-fixes.ts'
import { tied } from './public/typography.ts'

export const EDIT_GROUP_LABEL = 'Upravit název a poznámku…'
export const REMOVE_GROUP_LABEL = 'Odebrat skupinu…'

/** In an issue still open, as every fix but the issue's removal (`12u`, `12h`). */
export function canEditGroup(isIssueOpen: boolean): boolean {
  return isIssueOpen
}

/**
 * A group with no batch that is not discarded, the row's _zatím bez děl_, in an issue still open
 * (`12u`). Discarded batches do not count, so the row's count already says it.
 */
export function canRemoveGroup(liveArtworks: number, isIssueOpen: boolean): boolean {
  return isIssueOpen && liveArtworks === 0
}

/**
 * Whether the name the editor typed renames the folder: compared as the app stores it, so a change
 * of case or of the spaces inside is a rename too, and the spaces around it are not (`12f`).
 */
export function isGroupRename(current: string, typed: string): boolean {
  return typed.normalize('NFC').trim() !== current
}

/** The issue's names by their key without the group's own, which its own name never collides with. */
export function otherGroupNames(
  names: ReadonlyMap<string, string>,
  ownName: string,
): Map<string, string> {
  let others = new Map(names)
  others.delete(groupNameKey(ownName))
  return others
}

/* ---------- Upravit skupinu (`12f`) ---------- */

export const EDIT_GROUP_TITLE = 'Upravit skupinu'

/** Above the fields, the same in every state of the dialog, so it never moves while typing. */
export const EDIT_GROUP_TEXT: readonly [string, string] = [
  tied`Při změně názvu se přejmenuje i složka skupiny na sdíleném disku Publikace. V Evidenci se nový název může objevit později. Pokud upravíte jen poznámku, na Disku se nic nezmění.`,
  tied`Odkaz na nahrání děl platí dál. Nikomu se nic nepošle a e-maily, které už odešly, nesou dosavadní název.`,
]

export const SAVE_GROUP_LABEL = 'Uložit'
export const SAVE_AND_RENAME_GROUP_LABEL = 'Uložit a přejmenovat složku'
export const SAVE_GROUP_PENDING_LABEL = 'Ukládá se…'

export const GROUP_NOTE_SAVED_TOAST = tied`Poznámka pro grafika je uložená.`
export const GROUP_RENAMED_TOAST = tied`Skupina i její složka jsou přejmenované.`

/* The races of `12f`: the step wrote nothing and says what holds now. */
export const GROUP_CHANGED_MEANWHILE_TOAST = tied`Skupina se mezitím změnila. Vaše změny se neuložily.`
export const GROUP_REMOVED_MEANWHILE_TOAST = tied`Skupina už je odebraná. Vaše změny se neuložily.`

export function editGroupClosedToast(issueName: string): string {
  return tied`Vydání ${issueName} je uzavřené. Skupinu už nejde upravit.`
}

const NOTHING_CHANGED = 'Nic se nezměnilo.'

export const RENAME_GROUP_UNAVAILABLE: FixCallout = {
  text: [tied`${NOTHING_CHANGED} Disk teď neodpovídá.`],
  title: [tied`Zkuste skupinu přejmenovat za chvíli znovu.`],
}

export const RENAME_GROUP_DISCONNECTED: FixCallout = {
  text: [NOTHING_CHANGED],
  title: [tied`Nejdřív v Nastavení připojte účet publikace.app@vednemesicnik.cz.`],
}

export const RENAME_GROUP_FOLDER_MISSING: FixCallout = {
  text: [NOTHING_CHANGED],
  title: [tied`Obnovte složku skupiny z koše, nebo ji vraťte na sdílený disk Publikace.`],
}

/**
 * The group's `_meta.json` in the bin while its folder is there: every such file is named alike,
 * so the step links the one by its ID and the screen never names the file (`12f`, as `12x`).
 */
export function renameGroupMetaBinned(href: string): FixCallout {
  let title: CalloutPart[] = [
    'Otevřete ',
    { href, text: 'soubor pro tuto skupinu' },
    tied` a obnovte ho z koše.`,
  ]
  return { text: [NOTHING_CHANGED], title }
}

/* ---------- Odebrat skupinu (`12f`) ---------- */

export const REMOVE_GROUP_CONFIRM_LABEL = 'Odebrat skupinu'

/** The name in quotes: it is text the editor typed, and would run into the question without them. */
export function removeGroupTitle(name: string): string {
  return tied`Odebrat skupinu „${name}“?`
}

/**
 * The dialog's paragraphs in `12f`'s order: the folder and what is in it, where the group stops
 * being seen and the link that stops working, that the bin gives nothing back, the mail. The last
 * speaks of the replies to discarded batches, which the app no longer reads once the group is gone.
 */
export function removeGroupDialogText(discarded: {
  count: number
  isReplyWaiting: boolean
}): string[] {
  let paragraphs = [
    tied`Složka skupiny se přesune do koše sdíleného disku Publikace i s nahranými soubory, které nikdo neodeslal.`,
    tied`Skupina zmizí z vydání. Odkaz na nahrání děl přestane platit.`,
    tied`Obnovením složky z koše se skupina do aplikace nevrátí.`,
    tied`Nikomu se nic nepošle.`,
  ]
  if (discarded.count === 0) return paragraphs
  let batches = discarded.count === 1 ? 'k zahozené dávce' : 'k zahozeným dávkám'
  let reply = tied`Pokud ještě přijde odpověď na žádost ${batches}, najdete ji jen ve schránce publikace@.`
  let waiting = tied`Odebráním skupiny zmizí z části Ke kontrole i odpověď, která tam už čeká.`
  return [...paragraphs, discarded.isReplyWaiting ? `${reply} ${waiting}` : reply]
}

export const GROUP_REMOVED_TOAST = tied`Složka skupiny je v koši sdíleného disku Publikace.`

/* The races of `12f`: the step wrote nothing and says what holds now. */
export const REMOVE_GROUP_ARTWORKS_TOAST = tied`Ke skupině mezitím přišla obrazová díla. Skupina zůstala ve vydání.`

export function removeGroupClosedToast(issueName: string): string {
  return tied`Vydání ${issueName} je uzavřené. Skupina zůstala ve vydání.`
}

const GROUP_UNCHANGED = tied`Skupina zůstala, jak byla.`

export const REMOVE_GROUP_UNAVAILABLE: FixCallout = {
  text: [tied`${GROUP_UNCHANGED} Disk teď neodpovídá.`],
  title: [tied`Zkuste skupinu odebrat za chvíli znovu.`],
}

export const REMOVE_GROUP_DISCONNECTED: FixCallout = {
  text: [tied`Pak zkuste skupinu odebrat znovu.`],
  title: [tied`Nejdřív v Nastavení připojte účet publikace.app@vednemesicnik.cz.`],
}

/** The group folder is not in `Skupiny obrazových děl` of its issue, so it stays where it is. */
export function movedGroupFolderCallout(folderHref: string, issueName: string): FixCallout {
  return {
    text: [tied`Teď je jinde, a tak skupina zůstala, jak byla.`],
    title: [
      'Vraťte ',
      { href: folderHref, text: 'složku skupiny' },
      tied` do složky Skupiny obrazových děl vydání ${issueName}.`,
    ],
  }
}

const GROUP_FOREIGN_WORDS: ForeignFilesWords = {
  kept: GROUP_UNCHANGED,
  step: tied`Přesuňte ze složky skupiny soubory, které do ní nedala aplikace.`,
}

/** Files a person put into the group's folders (`12f`), named as `12w` names them. */
export function groupForeignFilesCallout(files: readonly ForeignFile[]): FixCallout {
  return foreignFilesCallout(files, GROUP_FOREIGN_WORDS)
}
