/**
 * Artwork groups (#133, `12e`): images that go with several texts and so belong to no single
 * article; the magazine illustrates no cover and no back page. Only the editors-in-chief create one, in the issue detail;
 * the link that goes out uploads into that one group (`03` rows 6 and 7). A group is tied to no
 * article: which texts its artworks go with, the note for the designer says.
 *
 * Pure, so the rules and the sentences are tested here rather than through a request. The words
 * are `12e`'s and `12a`'s as drawn.
 */

import { tied } from './public/typography.ts'

export const MAX_GROUP_NAME_LENGTH = 200
export const MAX_GROUP_NOTE_LENGTH = 500

/** The issue's folder that holds every group folder, as the scripts name it. */
export const GROUPS_FOLDER_NAME = 'Skupiny obrazových děl'

/** `_meta.json`'s `kind` for a group, the one every script reads it by. */
export const GROUP_META_KIND = 'artwork-group'

/**
 * What a duplicate is judged by, as an issue name is: case and the spaces around the name do not
 * count, and neither does how a pasted accent was encoded.
 */
export function groupNameKey(name: string): string {
  return name.normalize('NFC').trim().toLowerCase()
}

export const EMPTY_GROUP_NAME_MESSAGE = 'Vyplňte název skupiny.'
export const LONG_GROUP_NAME_MESSAGE = 'Zkraťte název na nejvýš 200 znaků.'
export const LONG_GROUP_NOTE_MESSAGE = 'Zkraťte poznámku na nejvýš 500 znaků.'

export function duplicateGroupMessage(existingName: string): string {
  return tied`Skupina ${existingName} už ve vydání je. Zvolte jiný název.`
}

export type GroupInput = { name: string; note: string }

export type GroupCheck =
  | { errors: { name: string | null; note: string | null }; ok: false }
  | { name: string; nameKey: string; note: string; ok: true }

/**
 * The dialog's own rules (`12e`). `existing` maps the issue's group names by their key to the name
 * as it was given, so the message names the group that is there.
 */
export function checkGroup(input: GroupInput, existing: ReadonlyMap<string, string>): GroupCheck {
  let name = input.name.normalize('NFC').trim()
  let note = input.note.normalize('NFC').trim()
  let nameError: string | null = null
  if (name === '') nameError = EMPTY_GROUP_NAME_MESSAGE
  else if ([...name].length > MAX_GROUP_NAME_LENGTH) nameError = LONG_GROUP_NAME_MESSAGE
  else {
    let taken = existing.get(groupNameKey(name))
    if (taken !== undefined) nameError = duplicateGroupMessage(taken)
  }
  let noteError = [...note].length > MAX_GROUP_NOTE_LENGTH ? LONG_GROUP_NOTE_MESSAGE : null
  if (nameError !== null || noteError !== null) {
    return { errors: { name: nameError, note: noteError }, ok: false }
  }
  return { name, nameKey: groupNameKey(name), note, ok: true }
}

/**
 * `_meta.json` in the group folder, in the shape `Artwork_Group_Create` writes: an article's keys
 * without `docId` and `authors`, `articleName` holding the group's name, `kind` saying it is a
 * group. `sheetId` stays `null`, as an article's does: the app's Evidence is a record only the app
 * writes.
 */
export function groupMeta(group: {
  groupFolderId: string
  issue: string
  issueFolderId: string
  name: string
  note: string
}): string {
  return JSON.stringify({
    kind: GROUP_META_KIND,
    articleName: group.name,
    issue: group.issue,
    articleFolderId: group.groupFolderId,
    issueFolderId: group.issueFolderId,
    sheetId: null,
    note: group.note,
  })
}

/* `12a`, `12c`, `12e`. */
export const GROUPS_SECTION_TITLE = 'Skupiny obrazových děl'
export const NEW_GROUP_LABEL = 'Nová skupina'
export const GROUPS_EMPTY_TEXT = tied`Skupinu založte, když dílo patří k více textům.`
export const OPEN_GROUP_FOLDER_LABEL = 'Otevřít složku skupiny'

export const NEW_GROUP_DIALOG_TITLE = 'Nová skupina obrazových děl'
export const NEW_GROUP_DIALOG_TEXT = tied`Do skupiny patří jen díla, která jsou společná více textům. Skupina dostane složku a odkaz na nahrání.`
/** The design system's mark of an optional field, after its label (`34on3abs`). */
export const OPTIONAL_MARK = '(nepovinné)'
export const GROUP_NAME_LABEL = 'Název skupiny'
export const GROUP_NAME_PLACEHOLDER = tied`Mapa obce k rozhovoru i reportáži`
export const GROUP_NOTE_LABEL = 'Poznámka pro grafika'
export const GROUP_NOTE_PLACEHOLDER = tied`Např. k textům „Název prvního textu“ a „Název druhého textu“.`
export const GROUP_NOTE_HINT = tied`Ke kterým textům díla patří. Grafik ji uvidí u každého díla skupiny.`
export const CREATE_GROUP_LABEL = 'Vytvořit skupinu'
/* While the group is made, as _Nové vydání_ says _Vydání se vytváří…_ (`11d`). */
export const CREATE_GROUP_PENDING_LABEL = 'Skupina se vytváří…'
export const CREATE_GROUP_UNAVAILABLE_TITLE = tied`Zkuste skupinu vytvořit za chvíli znovu.`
export const CREATE_GROUP_UNAVAILABLE_TEXT = tied`Disk teď neodpovídá.`
export const GROUP_CREATED_TOAST = tied`Skupina je vytvořená. Odkaz pošlete tomu, kdo díla dodá.`

/** `Pro grafika: K textům „…“.` under the group's name (`12a`) and on its upload page (`21a`). */
export function groupNoteLine(note: string): string {
  return tied`Pro grafika: ${note}`
}

/** `· 4 díla`, `· zatím bez děl` after the group's name (`12a`): its artworks sent in batches. */
export function groupCountText(count: number): string {
  if (count === 0) return '· zatím bez děl'
  if (count === 1) return '· 1 dílo'
  if (count >= 2 && count <= 4) return `· ${count} díla`
  return `· ${count} děl`
}

export function groupMenuLabel(name: string): string {
  return tied`Další akce skupiny ${name}`
}
