import {
  type Cell,
  DATE_TIME_PATTERN,
  EVIDENCE_NAME,
  EVIDENCE_PROPERTY,
  HEADER_STYLE,
  type SheetLayout,
} from '../domain/record.ts'
import {
  createDriveCall,
  describe,
  type DriveCall,
  escapeQuery,
  FILES_ENDPOINT,
  readJson,
  SHEETS_ENDPOINT,
  SPREADSHEET_TYPE,
} from './http.server.ts'

/**
 * The calls the record queue makes (#111): the Evidence found or created in the issue folder, its
 * lists laid out once, the app's list added to the Registr once, and every write a whole list.
 *
 * The app never reads a cell. It reads a spreadsheet's list titles, which is the only way to know
 * whether a list it lays out is there yet, and writes each list whole from A1 with the rest
 * cleared. `RAW` keeps a name starting with `=` text, as the scripts' `Toolkit.literalText` does.
 *
 * Each answer is `ok` or a described failure, never a throw: the queue logs it and tries again
 * later, and no action waits for it.
 */

export type SheetsResult = { error: string; ok: false } | { ok: true }

export type EvidenceFound = { error: string; ok: false } | { id: string; ok: true }

export type RecordList = { layout: SheetLayout; rows: readonly Cell[][] }

export type RecordSheets = {
  /**
   * The issue's Evidence in its folder, by the key on the file, or a new one with that key. A
   * write that stopped after creating it finds the same file again.
   */
  findOrCreateEvidence(folderId: string, issueId: number): Promise<EvidenceFound>
  /**
   * Adds the lists of `layouts` the spreadsheet lacks, laid out, protected for `editor` alone.
   * `isOwn` for a spreadsheet the app created, the Evidence: its one empty list becomes the
   * first of `layouts`. Never for the Registr, whose lists are the scripts'.
   */
  layOut(
    spreadsheetId: string,
    layouts: readonly SheetLayout[],
    options?: { isOwn?: boolean },
  ): Promise<SheetsResult>
  /** Writes each list whole, its header first, and clears whatever stood below it. */
  write(spreadsheetId: string, lists: readonly RecordList[]): Promise<SheetsResult>
}

export type RecordSheetsOptions = {
  accessToken: string
  /** The only account the lists stay editable for: `publikace.app@`. */
  editor: string
  fetch?: typeof globalThis.fetch
}

function failed(response: Response | null, body: Record<string, unknown> = {}): SheetsResult {
  return { error: response === null ? 'no answer' : describe(response, body), ok: false }
}

/** `N` for the 14th column: the last column a list has, so a clear stays inside its grid. */
function columnLetter(count: number): string {
  let letters = ''
  for (let rest = count; rest > 0; rest = Math.floor((rest - 1) / 26)) {
    letters = String.fromCharCode(65 + ((rest - 1) % 26)) + letters
  }
  return letters
}

/** `'Redakční doložky'!A1`: a list's name quoted for A1 notation. */
function rangeOf(title: string, cells: string): string {
  return `'${title.replaceAll("'", "''")}'!${cells}`
}

function rgb(hex: string): { blue: number; green: number; red: number } {
  let value = Number.parseInt(hex.slice(1), 16)
  return {
    blue: (value & 0xff) / 255,
    green: ((value >> 8) & 0xff) / 255,
    red: (value >> 16) / 255,
  }
}

function columnRange(sheetId: number, column: number, fromRow: number) {
  return { endColumnIndex: column + 1, sheetId, startColumnIndex: column, startRowIndex: fromRow }
}

/** Everything one list gets when the app makes it: style, formats, validation, protection. */
function layoutRequests(layout: SheetLayout, sheetId: number, editor: string): unknown[] {
  let requests: unknown[] = [
    {
      updateSheetProperties: {
        fields: 'gridProperties.frozenRowCount',
        properties: { gridProperties: { frozenRowCount: 1 }, sheetId },
      },
    },
    {
      repeatCell: {
        cell: {
          userEnteredFormat: {
            backgroundColor: rgb(HEADER_STYLE.background),
            textFormat: { bold: true, foregroundColor: rgb(HEADER_STYLE.color) },
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat)',
        range: { endRowIndex: 1, sheetId, startRowIndex: 0 },
      },
    },
  ]
  for (let column of layout.dateColumns) {
    requests.push({
      repeatCell: {
        cell: {
          userEnteredFormat: { numberFormat: { pattern: DATE_TIME_PATTERN, type: 'DATE_TIME' } },
        },
        fields: 'userEnteredFormat.numberFormat',
        range: columnRange(sheetId, column, 1),
      },
    })
  }
  if (layout.checkboxColumn !== undefined) {
    requests.push({
      setDataValidation: {
        range: columnRange(sheetId, layout.checkboxColumn, 1),
        rule: { condition: { type: 'BOOLEAN' } },
      },
    })
  }
  if (layout.status !== undefined) {
    let { colors, column, helpText, values } = layout.status
    requests.push({
      setDataValidation: {
        range: columnRange(sheetId, column, 1),
        rule: {
          condition: {
            type: 'ONE_OF_LIST',
            values: values.map((value) => ({ userEnteredValue: value })),
          },
          inputMessage: helpText,
          showCustomUi: true,
          strict: false,
        },
      },
    })
    for (let [index, { color, value }] of colors.entries()) {
      requests.push({
        addConditionalFormatRule: {
          index,
          rule: {
            booleanRule: {
              condition: { type: 'TEXT_EQ', values: [{ userEnteredValue: value }] },
              format: { backgroundColor: rgb(color) },
            },
            ranges: [columnRange(sheetId, column, 1)],
          },
        },
      })
    }
  }
  requests.push(protectionRequest(sheetId, editor))
  return requests
}

/** The whole list editable by `editor` alone, people reading it (`AGENTS.md`). */
function protectionRequest(sheetId: number, editor: string): unknown {
  return {
    addProtectedRange: {
      protectedRange: {
        description: 'Zapisuje aplikace Publikace.',
        editors: { users: [editor] },
        range: { sheetId },
        warningOnly: false,
      },
    },
  }
}

/**
 * A list as `layOut` sees it: its title, whether a protection covers all of it with the app's
 * account as its only editor, and the whole-list protections that let anybody else in. A list of
 * the app's name that somebody else made, or whose protection was loosened, is then protected
 * again rather than trusted by its title, and the loosened protection goes.
 */
type ListTitle = {
  isProtected: boolean
  loosened: readonly number[]
  sheetId: number
  title: string
}

type ProtectedRange = {
  editors?: { domainUsersCanEdit?: unknown; groups?: unknown; users?: unknown }
  protectedRangeId?: unknown
  range?: Record<string, unknown>
  unprotectedRanges?: unknown
  warningOnly?: unknown
}

/**
 * Google's JSON leaves out a field whose value is its zero, so the first list's `sheetId` 0 and a
 * range's start at 0 arrive absent: an absent number is read as 0, never as missing.
 */
function numberOr0(value: unknown): number | null {
  if (value === undefined) return 0
  return typeof value === 'number' ? value : null
}

/** The whole list: no bound but its `sheetId`, which may itself be absent for list 0. */
function isWholeList(protection: ProtectedRange, sheetId: number): boolean {
  let range = protection.range ?? {}
  return (
    Object.keys(range).every((key) => key === 'sheetId') && numberOr0(range['sheetId']) === sheetId
  )
}

/**
 * All of the list, nothing carved out of it, and nobody may edit it but `editor` and the file's
 * owners, whom Google lists as editors of every protection and who cannot be taken off one.
 */
function isTightFor(
  protection: ProtectedRange,
  editor: string,
  owners: ReadonlySet<string>,
): boolean {
  let users = (Array.isArray(protection.editors?.users) ? protection.editors.users : []).map(
    (user) => String(user).toLowerCase(),
  )
  let groups = Array.isArray(protection.editors?.groups) ? protection.editors.groups : []
  let carved = Array.isArray(protection.unprotectedRanges) ? protection.unprotectedRanges : []
  let me = editor.toLowerCase()
  return (
    users.includes(me) &&
    users.every((user) => user === me || owners.has(user)) &&
    groups.length === 0 &&
    protection.editors?.domainUsersCanEdit !== true &&
    carved.length === 0 &&
    protection.warningOnly !== true
  )
}

/**
 * The file's owners, by address: none for a file on a shared drive, which belongs to the drive,
 * and the person whose file it is for a spreadsheet in somebody's Můj disk, as the Registr is.
 */
async function ownersOf(
  call: DriveCall,
  spreadsheetId: string,
): Promise<{ error: string; ok: false } | { ok: true; owners: Set<string> }> {
  let url = new URL(`${FILES_ENDPOINT}/${encodeURIComponent(spreadsheetId)}`)
  url.searchParams.set('fields', 'owners(emailAddress)')
  url.searchParams.set('supportsAllDrives', 'true')
  let response = await call('a spreadsheet’s owners were not looked up', url)
  if (response === null) return { error: 'no answer', ok: false }
  let body = await readJson(response)
  if (!response.ok) return { error: describe(response, body), ok: false }
  let owners = Array.isArray(body['owners']) ? (body['owners'] as { emailAddress?: unknown }[]) : []
  return {
    ok: true,
    owners: new Set(
      owners.flatMap((owner) =>
        typeof owner.emailAddress === 'string' ? [owner.emailAddress.toLowerCase()] : [],
      ),
    ),
  }
}

async function listTitles(
  call: DriveCall,
  spreadsheetId: string,
  editor: string,
  owners: ReadonlySet<string>,
): Promise<{ error: string; ok: false } | { lists: ListTitle[]; ok: true }> {
  let url = new URL(`${SHEETS_ENDPOINT}/${encodeURIComponent(spreadsheetId)}`)
  url.searchParams.set(
    'fields',
    'sheets(properties(sheetId,title),protectedRanges(protectedRangeId,range,unprotectedRanges,editors,warningOnly))',
  )
  let response = await call('a spreadsheet was not looked at', url)
  if (response === null) return { error: 'no answer', ok: false }
  let body = await readJson(response)
  if (!response.ok || !Array.isArray(body['sheets'])) {
    return { error: describe(response, body), ok: false }
  }
  let lists = (body['sheets'] as unknown[]).flatMap((sheet) => {
    let { properties, protectedRanges } = sheet as {
      properties?: { sheetId?: unknown; title?: unknown }
      protectedRanges?: unknown
    }
    let sheetId = numberOr0(properties?.sheetId)
    if (sheetId === null || typeof properties?.title !== 'string') return []
    let whole = (
      Array.isArray(protectedRanges) ? (protectedRanges as ProtectedRange[]) : []
    ).filter((protection) => isWholeList(protection, sheetId))
    return [
      {
        isProtected: whole.some((protection) => isTightFor(protection, editor, owners)),
        loosened: whole.flatMap((protection) => {
          let id = numberOr0(protection.protectedRangeId)
          return !isTightFor(protection, editor, owners) && id !== null ? [id] : []
        }),
        sheetId,
        title: properties.title,
      },
    ]
  })
  return { lists, ok: true }
}

export function createRecordSheets(options: RecordSheetsOptions): RecordSheets {
  let call = createDriveCall(options.accessToken, options.fetch ?? globalThis.fetch)

  return {
    async findOrCreateEvidence(folderId, issueId) {
      let query = new URL(FILES_ENDPOINT)
      query.searchParams.set(
        'q',
        `'${escapeQuery(folderId)}' in parents and appProperties has { key='${EVIDENCE_PROPERTY}' and value='${issueId}' } and trashed = false`,
      )
      query.searchParams.set('fields', 'files(id,trashed)')
      query.searchParams.set('supportsAllDrives', 'true')
      query.searchParams.set('includeItemsFromAllDrives', 'true')
      let found = await call('the Evidence was not looked up', query)
      if (found === null) return { error: 'no answer', ok: false }
      let foundBody = await readJson(found)
      if (!found.ok || !Array.isArray(foundBody['files'])) {
        return { error: describe(found, foundBody), ok: false }
      }
      let existing = (foundBody['files'] as { id?: unknown; trashed?: unknown }[]).find(
        (file) => typeof file.id === 'string' && file.trashed !== true,
      )
      if (typeof existing?.id === 'string') return { id: existing.id, ok: true }

      let url = new URL(FILES_ENDPOINT)
      url.searchParams.set('supportsAllDrives', 'true')
      url.searchParams.set('fields', 'id')
      let response = await call('the Evidence was not created', url, {
        body: JSON.stringify({
          appProperties: { [EVIDENCE_PROPERTY]: String(issueId) },
          mimeType: SPREADSHEET_TYPE,
          name: EVIDENCE_NAME,
          parents: [folderId],
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      if (response === null) return { error: 'no answer', ok: false }
      let body = await readJson(response)
      if (response.ok && typeof body['id'] === 'string') return { id: body['id'], ok: true }
      return { error: describe(response, body), ok: false }
    },

    async layOut(spreadsheetId, layouts, layOutOptions = {}) {
      let owners = await ownersOf(call, spreadsheetId)
      if (!owners.ok) return owners
      let titles = await listTitles(call, spreadsheetId, options.editor, owners.owners)
      if (!titles.ok) return titles
      let ours = new Set(layouts.map((layout) => layout.name))
      let present = new Map(titles.lists.map((list) => [list.title, list]))
      let nextId = Math.max(0, ...titles.lists.map((list) => list.sheetId)) + 1
      /* A spreadsheet the app created comes with one empty list of a locale's name, which becomes
         the first list rather than staying beside it. Another spreadsheet's list is never
         renamed: in the Registr it is the scripts' Vydání. */
      let spare =
        layOutOptions.isOwn === true &&
        titles.lists.length === 1 &&
        !ours.has(titles.lists[0]?.title ?? '')
          ? titles.lists[0]
          : undefined

      let requests: unknown[] = []
      for (let layout of layouts) {
        let existing = present.get(layout.name)
        if (existing !== undefined) {
          for (let protectedRangeId of existing.loosened) {
            requests.push({ deleteProtectedRange: { protectedRangeId } })
          }
          if (!existing.isProtected) {
            requests.push(protectionRequest(existing.sheetId, options.editor))
          }
          /* Rare by design: a line on every write would say that Google reads a protection back
             otherwise than this code expects, which the fake cannot show. */
          if (existing.loosened.length > 0 || !existing.isProtected) {
            console.info(`[record] the protection of the list ${layout.name} was put back`)
          }
          continue
        }
        let sheetId: number
        if (spare !== undefined) {
          sheetId = spare.sheetId
          requests.push({
            updateSheetProperties: { fields: 'title', properties: { sheetId, title: layout.name } },
          })
          spare = undefined
        } else {
          sheetId = nextId
          nextId += 1
          requests.push({ addSheet: { properties: { sheetId, title: layout.name } } })
        }
        requests.push(...layoutRequests(layout, sheetId, options.editor))
      }
      if (requests.length === 0) return { ok: true }

      let url = new URL(`${SHEETS_ENDPOINT}/${encodeURIComponent(spreadsheetId)}:batchUpdate`)
      let response = await call('a spreadsheet was not laid out', url, {
        body: JSON.stringify({ requests }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      if (response === null) return failed(null)
      let body = await readJson(response)
      return response.ok ? { ok: true } : failed(response, body)
    },

    async write(spreadsheetId, lists) {
      let base = `${SHEETS_ENDPOINT}/${encodeURIComponent(spreadsheetId)}/values`
      let response = await call('a record was not written', new URL(`${base}:batchUpdate`), {
        body: JSON.stringify({
          data: lists.map(({ layout, rows }) => ({
            range: rangeOf(layout.name, 'A1'),
            values: [layout.headers, ...rows],
          })),
          valueInputOption: 'RAW',
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      if (response === null) return failed(null)
      if (!response.ok) return failed(response, await readJson(response))

      let cleared = await call('a record was not cleared', new URL(`${base}:batchClear`), {
        body: JSON.stringify({
          ranges: lists.map(({ layout, rows }) =>
            rangeOf(layout.name, `A${rows.length + 2}:${columnLetter(layout.headers.length)}`),
          ),
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      if (cleared === null) return failed(null)
      return cleared.ok ? { ok: true } : failed(cleared, await readJson(cleared))
    },
  }
}
