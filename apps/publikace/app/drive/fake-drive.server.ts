/**
 * Google as the suite sees it: the token endpoint, Drive's files and the Docs call that writes an
 * article's name, answered from memory. Handed to the app as its `fetch`, so no test reaches
 * Google.
 */

export type FakeFolder = { id: string; name: string; parentId: string; isTrashed: boolean }

/** Any file the fake holds; a folder is one with the folder type. */
export type FakeFile = FakeFolder & {
  appProperties: Record<string, string>
  /** What a resumable upload stored, or what an export or a read answers with. */
  bytes: Uint8Array<ArrayBuffer> | null
  /** The uploaded text, for `_meta.json`. */
  content: string | null
  /** The template a copy came from. */
  copiedFrom: string | null
  mimeType: string
  /** What `replaceAllText` wrote into a Doc, in order. */
  replacements: { text: string; with: string }[]
}

/**
 * One kind of call, for failing it on purpose: `upload` is a small multipart file, `store` a
 * resumable one (an artwork, a licence PDF), `import` a Doc made from HTML, `sheets` every call to
 * the Sheets API and the creation of a spreadsheet, `rename` a file's new name, `rewrite` a text
 * file's content written over.
 */
export const FAKE_STEPS = [
  'copy',
  'export',
  'folder',
  'import',
  'permissions',
  'preview',
  'rename',
  'replace',
  'rewrite',
  'revisions',
  'sheets',
  'store',
  'trash',
  'upload',
] as const

export type FakeStep = (typeof FAKE_STEPS)[number]

/** One list of a fake spreadsheet: its cells and what laying it out set on it. */
export type FakeList = {
  cells: (boolean | number | string)[][]
  checkboxColumn: number | null
  dateColumns: number[]
  frozenRows: number
  isHeaderStyled: boolean
  /** The protections of the whole list, each with who may edit it. */
  protections: FakeProtection[]
  sheetId: number
  statusValues: string[] | null
  title: string
}

export type FakeProtection = {
  domainUsersCanEdit?: boolean
  groups?: string[]
  id: number
  users: string[]
}

export type FakeSpreadsheet = { id: string; lists: FakeList[] }

/** Whose Můj disk a seeded spreadsheet, the Registr, is in. */
export const FAKE_SPREADSHEET_OWNER = 'sefredakce@vednemesicnik.test'

function emptyList(sheetId: number, title: string): FakeList {
  return {
    cells: [],
    checkboxColumn: null,
    dateColumns: [],
    frozenRows: 0,
    isHeaderStyled: false,
    protections: [],
    sheetId,
    statusValues: null,
    title,
  }
}

/** One grant on a file, in the fields `permissions.list` answers with. */
export type FakePermission = {
  domain?: string
  emailAddress?: string
  role: 'commenter' | 'fileOrganizer' | 'organizer' | 'owner' | 'reader' | 'writer'
  type: 'anyone' | 'domain' | 'group' | 'user'
}

export type FakeDrive = {
  /** Every call that reached the fake, as `METHOD path`. */
  calls: string[]
  /** Creating a folder of this name answers 503 until `heal()`. */
  failCreate(name: string): void
  /** Taking any file back out of the bin answers 503 until `heal()`. */
  failRestore(): void
  /** Every call of this kind answers 503 until `heal()`. */
  failStep(step: FakeStep): void
  /** Moving this file to the bin answers 503 until `heal()`; other files go as usual. */
  failTrashOf(id: string): void
  /** Writing this file's content over answers 503 until `heal()`; other files go as usual. */
  failRewriteOf(id: string): void
  fetch: typeof globalThis.fetch
  files(): FakeFile[]
  folders(): FakeFolder[]
  /** Every Drive call throws, as an unreachable network would. The token still answers. */
  goDown(): void
  heal(): void
  /** Creates the folder but answers 503, as a reply lost on the way back would. */
  loseReplyOnCreate(name: string): void
  /** The next call of this kind does its work but answers 503. */
  loseReplyOnStep(step: FakeStep): void
  /** Moves a file to another folder, as a person dragging it on Drive would. */
  move(id: string, parentId: string): void
  remove(id: string): void
  /** Takes a file out of the bin, as a person restoring it on Drive would. */
  restore(id: string): void
  /**
   * An edit of a Doc's text at `at`: a revision in its history and its `modifiedTime`, as a
   * person typing in it makes (#101).
   */
  reviseDoc(id: string, at: Temporal.Instant): void
  /** Moves only a file's `modifiedTime`, as a comment or a rename does: no revision. */
  touch(id: string, at: Temporal.Instant): void
  /** A folder that exists already, as an article's does once the article page made it. */
  seedFolder(id: string, name: string, parentId: string): void
  /** A Doc that exists already, as a copy somebody made of an article's Doc. */
  seedDoc(id: string, name: string, parentId: string): void
  /** A file to copy from, as the article template is on the shared drive. */
  seedTemplate(id: string, name: string): void
  /** A spreadsheet that exists already, as the Registr does, with its lists and their cells. */
  seedSpreadsheet(
    id: string,
    name: string,
    lists: { cells: (boolean | number | string)[][]; title: string }[],
  ): void
  /** A spreadsheet's lists as the Sheets calls left them. */
  spreadsheet(id: string): FakeSpreadsheet | undefined
  /** A protection somebody put on a whole list by hand. */
  protect(spreadsheetId: string, title: string, protection: Omit<FakeProtection, 'id'>): void
  /** Adds a grant to a file, as somebody sharing it would; a file starts with none. */
  share(id: string, permission: FakePermission): void
  trash(id: string): void
}

const FOLDER_TYPE = 'application/vnd.google-apps.folder'
const DOC_TYPE = 'application/vnd.google-apps.document'
const SPREADSHEET_TYPE = 'application/vnd.google-apps.spreadsheet'
const THUMBNAIL_HOST = 'lh3.googleusercontent.test'

/** What the fake exports a Doc as: recognisable, and different for every Doc. */
export function fakePdfOf(docId: string, html: string): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(`%PDF-fake ${docId} ${html.length}`)
}

/** What the fake renders as any image's thumbnail. */
export const FAKE_THUMBNAIL = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3])

function failure(message: string, status = 503): Response {
  return Response.json({ error: { message } }, { status })
}

export function createFakeDrive(): FakeDrive {
  let files = new Map<string, FakeFile>()
  let failingNames = new Set<string>()
  let losingNames = new Set<string>()
  let failingSteps = new Set<FakeStep>()
  let failingTrashes = new Set<string>()
  let failingRewrites = new Set<string>()
  let isRestoreFailing = false
  let losingSteps = new Set<FakeStep>()
  let isDown = false
  let next = 1
  let calls: string[] = []
  let spreadsheets = new Map<string, FakeSpreadsheet>()
  /* A file in somebody's Můj disk has an owner; one on a shared drive has none. */
  let owners = new Map<string, string>()
  let permissions = new Map<string, FakePermission[]>()
  /* Kept beside the files: only a Doc somebody edited or touched has them. */
  let modifiedTimes = new Map<string, Temporal.Instant>()
  let revisions = new Map<string, Temporal.Instant[]>()
  let sessions = new Map<
    string,
    { appProperties: Record<string, string>; mimeType: string; name: string; parentId: string }
  >()

  function add(
    file: Omit<FakeFile, 'bytes' | 'id' | 'isTrashed' | 'replacements'> & {
      bytes?: Uint8Array<ArrayBuffer>
    },
    prefix: string,
  ): FakeFile {
    let id = `fake-${prefix}-${next++}`
    let stored: FakeFile = {
      ...file,
      bytes: file.bytes ?? null,
      id,
      isTrashed: false,
      replacements: [],
    }
    files.set(id, stored)
    return stored
  }

  /**
   * In the bin itself or under a folder that is, as Drive answers `trashed` for both and
   * `explicitlyTrashed` only for the one somebody put there.
   */
  function isBinned(file: FakeFile): boolean {
    let seen = new Set<string>()
    let current: FakeFile | undefined = file
    while (current !== undefined && !seen.has(current.id)) {
      if (current.isTrashed) return true
      seen.add(current.id)
      current = files.get(current.parentId)
    }
    return false
  }

  /** The answer for a call that did its work: lost on purpose, or the file's ID. */
  function done(step: FakeStep, id: string): Response {
    if (losingSteps.has(step)) {
      losingSteps.delete(step)
      return failure('lost')
    }
    return Response.json({ id })
  }

  /** The list a range like `'Redakční doložky'!A14:ZZ` names, and the row it starts at. */
  function listOf(
    sheet: FakeSpreadsheet,
    range: string,
  ): { list: FakeList; row: number } | undefined {
    let match = /^'((?:[^']|'')*)'!A(\d+)/.exec(range)
    let title = match?.[1]?.replaceAll("''", "'")
    let list = sheet.lists.find((candidate) => candidate.title === title)
    return list === undefined ? undefined : { list, row: Number(match?.[2]) }
  }

  /** The four calls the record makes of the Sheets API, answered from memory. */
  function sheetsCall(url: URL, method: string, init: RequestInit | undefined): Response {
    if (failingSteps.has('sheets')) return failure('down')
    let match = /^\/v4\/spreadsheets\/([^/:]+)(.*)$/.exec(url.pathname)
    let id = decodeURIComponent(match?.[1] ?? '')
    let file = files.get(id)
    let sheet = spreadsheets.get(id)
    if (file === undefined || sheet === undefined || isBinned(file)) {
      return failure('Requested entity was not found.', 404)
    }
    let rest = match?.[2] ?? ''
    let body = method === 'POST' ? (JSON.parse(String(init?.body)) as Record<string, unknown>) : {}

    if (method === 'GET' && rest === '') {
      return Response.json({
        /* As Google's JSON does: a field whose value is 0 is left out, so list 0 has no
           `sheetId`. */
        sheets: sheet.lists.map(({ protections, sheetId, title }) => {
          let id = sheetId === 0 ? {} : { sheetId }
          return {
            properties: { ...id, title },
            protectedRanges: protections.map(({ id: protectedRangeId, ...editors }) => ({
              editors,
              protectedRangeId,
              range: id,
            })),
          }
        }),
      })
    }

    if (method === 'POST' && rest === ':batchUpdate') {
      /* All or nothing, as Sheets applies a batch: worked on copies and kept only if it all
         applies. */
      let lists = sheet.lists.map((list) => ({
        ...list,
        dateColumns: [...list.dateColumns],
        protections: [...list.protections],
      }))
      let byId = (sheetId: unknown) => lists.find((list) => list.sheetId === sheetId)
      type Range = { sheetId?: number; startColumnIndex?: number; endRowIndex?: number }
      for (let request of body['requests'] as Record<string, Record<string, unknown>>[]) {
        let [kind, value] = Object.entries(request)[0] ?? []
        if (kind === 'addSheet') {
          let properties = (value as { properties: { sheetId: number; title: string } }).properties
          if (
            lists.some(
              (list) => list.title === properties.title || list.sheetId === properties.sheetId,
            )
          ) {
            return failure(`A sheet with the name "${properties.title}" already exists.`, 400)
          }
          lists.push(emptyList(properties.sheetId, properties.title))
        } else if (kind === 'updateSheetProperties') {
          let { fields, properties } = value as {
            fields: string
            properties: {
              gridProperties?: { frozenRowCount: number }
              sheetId: number
              title?: string
            }
          }
          let list = byId(properties.sheetId)
          if (list === undefined) return failure('no such sheet', 400)
          if (fields === 'title' && properties.title !== undefined) list.title = properties.title
          if (properties.gridProperties !== undefined) {
            list.frozenRows = properties.gridProperties.frozenRowCount
          }
        } else if (kind === 'repeatCell') {
          let { cell, range } = value as {
            cell: { userEnteredFormat: { numberFormat?: unknown } }
            range: Range
          }
          let list = byId(range.sheetId)
          if (list === undefined) return failure('no such sheet', 400)
          if (range.endRowIndex === 1) list.isHeaderStyled = true
          if (cell.userEnteredFormat.numberFormat !== undefined) {
            list.dateColumns.push(range.startColumnIndex ?? 0)
          }
        } else if (kind === 'setDataValidation') {
          let { range, rule } = value as {
            range: Range
            rule: { condition: { type: string; values?: { userEnteredValue: string }[] } }
          }
          let list = byId(range.sheetId)
          if (list === undefined) return failure('no such sheet', 400)
          if (rule.condition.type === 'BOOLEAN') list.checkboxColumn = range.startColumnIndex ?? 0
          else list.statusValues = (rule.condition.values ?? []).map((v) => v.userEnteredValue)
        } else if (kind === 'addProtectedRange') {
          let { protectedRange } = value as {
            protectedRange: { editors: { users: string[] }; range: Range }
          }
          let list = byId(protectedRange.range.sheetId)
          if (list === undefined) return failure('no such sheet', 400)
          /* Google lists the file's owner among the editors of every protection. */
          let owner = owners.get(id)
          let users = [...protectedRange.editors.users]
          if (owner !== undefined && !users.includes(owner)) users.push(owner)
          list.protections.push({ id: next++, users })
        } else if (kind === 'deleteProtectedRange') {
          let { protectedRangeId } = value as { protectedRangeId: number }
          let list = lists.find((candidate) =>
            candidate.protections.some((protection) => protection.id === protectedRangeId),
          )
          if (list === undefined) return failure('no such protected range', 400)
          list.protections = list.protections.filter(
            (protection) => protection.id !== protectedRangeId,
          )
        } else if (kind !== 'addConditionalFormatRule') {
          return failure(`unexpected request ${String(kind)}`, 400)
        }
      }
      sheet.lists = lists
      return Response.json({ spreadsheetId: id })
    }

    if (method === 'POST' && rest === '/values:batchUpdate') {
      if (body['valueInputOption'] !== 'RAW') return failure('the fake takes RAW only', 400)
      let data = body['data'] as { range: string; values: (boolean | number | string)[][] }[]
      let targets = data.map((entry) => ({ entry, target: listOf(sheet, entry.range) }))
      if (targets.some(({ target }) => target === undefined || target.row !== 1)) {
        return failure('Unable to parse range', 400)
      }
      for (let { entry, target } of targets) {
        if (target === undefined) continue
        target.list.cells = [
          ...entry.values.map((row) => [...row]),
          ...target.list.cells.slice(entry.values.length),
        ]
      }
      return Response.json({ spreadsheetId: id })
    }

    if (method === 'POST' && rest === '/values:batchClear') {
      let ranges = body['ranges'] as string[]
      let targets = ranges.map((range) => listOf(sheet, range))
      if (targets.some((target) => target === undefined))
        return failure('Unable to parse range', 400)
      for (let target of targets) {
        if (target !== undefined) target.list.cells = target.list.cells.slice(0, target.row - 1)
      }
      return Response.json({ spreadsheetId: id })
    }

    return failure('unexpected call', 400)
  }

  let fetch: typeof globalThis.fetch = async (input, init) => {
    let url = new URL(input instanceof Request ? input.url : String(input))
    let method = init?.method ?? 'GET'
    calls.push(`${method} ${url.pathname}`)

    if (url.hostname === 'oauth2.googleapis.com') {
      return Response.json({ access_token: 'test-access-token', expires_in: 3599 })
    }
    if (isDown) throw new TypeError('fetch failed')

    /* Drive answers 404 for a file on a shared drive asked for without these, so the fake does
       too: a call that forgets them fails here as it would there. */
    let isOnSharedDrives = url.searchParams.get('supportsAllDrives') === 'true'

    if (url.hostname === 'docs.googleapis.com') {
      let match = /^\/v1\/documents\/([^/:]+):batchUpdate$/.exec(url.pathname)
      let doc = files.get(decodeURIComponent(match?.[1] ?? ''))
      if (method !== 'POST' || doc === undefined) return failure('not found', 404)
      if (failingSteps.has('replace')) return failure('down')
      let body = JSON.parse(String(init?.body)) as {
        requests: { replaceAllText: { containsText: { text: string }; replaceText: string } }[]
      }
      for (let request of body.requests) {
        doc.replacements.push({
          text: request.replaceAllText.containsText.text,
          with: request.replaceAllText.replaceText,
        })
      }
      return done('replace', doc.id)
    }

    if (url.hostname === 'sheets.googleapis.com') return sheetsCall(url, method, init)

    if (url.hostname === THUMBNAIL_HOST) {
      if (failingSteps.has('preview')) return failure('down')
      return new Response(FAKE_THUMBNAIL, { headers: { 'Content-Type': 'image/png' } })
    }

    let rewritten = /^\/upload\/drive\/v3\/files\/([^/]+)$/.exec(url.pathname)
    if (method === 'PATCH' && rewritten !== null) {
      let file = files.get(decodeURIComponent(rewritten[1] ?? ''))
      if (file === undefined || !isOnSharedDrives) return failure('File not found', 404)
      if (url.searchParams.get('uploadType') !== 'media') return failure('bad upload', 400)
      if (failingSteps.has('rewrite') || failingRewrites.has(file.id)) return failure('down')
      file.content = String(init?.body)
      return done('rewrite', file.id)
    }

    if (
      url.pathname === '/upload/drive/v3/files' &&
      url.searchParams.get('uploadType') === 'resumable'
    ) {
      if (method === 'POST') {
        if (!isOnSharedDrives) return failure('File not found', 404)
        if (failingSteps.has('store')) return failure('down')
        let metadata = JSON.parse(String(init?.body)) as {
          appProperties?: Record<string, string>
          mimeType: string
          name: string
          parents: string[]
        }
        let sessionId = `session-${next++}`
        sessions.set(sessionId, {
          appProperties: metadata.appProperties ?? {},
          mimeType: metadata.mimeType,
          name: metadata.name,
          parentId: metadata.parents[0] ?? '',
        })
        let location = new URL(url)
        location.searchParams.set('upload_id', sessionId)
        return new Response(null, { headers: { Location: location.href } })
      }
      let session = sessions.get(url.searchParams.get('upload_id') ?? '')
      if (method !== 'PUT' || session === undefined) return failure('no session', 404)
      if (failingSteps.has('store')) return failure('down')
      let body = init?.body
      let bytes = new Uint8Array(await new Response(body).arrayBuffer())
      let file = add({ ...session, bytes, content: null, copiedFrom: null }, 'file')
      return done('store', file.id)
    }

    if (method === 'POST' && url.pathname === '/upload/drive/v3/files') {
      if (!isOnSharedDrives || url.searchParams.get('uploadType') !== 'multipart') {
        return failure('bad upload', 400)
      }
      let parts = String(init?.body).split(/\r\n--[^\r\n]+/)
      let metadata = JSON.parse(parts[0]?.split('\r\n\r\n')[1] ?? '{}') as {
        appProperties?: Record<string, string>
        mimeType?: string
        name: string
        parents: string[]
      }
      let content = parts[1]?.split('\r\n\r\n').slice(1).join('\r\n\r\n') ?? ''
      let step: FakeStep = metadata.mimeType === DOC_TYPE ? 'import' : 'upload'
      if (failingSteps.has(step)) return failure('down')
      let file = add(
        {
          appProperties: metadata.appProperties ?? {},
          content,
          copiedFrom: null,
          mimeType: metadata.mimeType ?? 'text/plain',
          name: metadata.name,
          parentId: metadata.parents[0] ?? '',
        },
        step === 'import' ? 'doc' : 'file',
      )
      return done(step, file.id)
    }

    if (method === 'POST' && url.pathname === '/drive/v3/files') {
      let body = JSON.parse(String(init?.body)) as {
        appProperties?: Record<string, string>
        mimeType?: string
        name: string
        parents: string[]
      }
      if (body.mimeType === SPREADSHEET_TYPE) {
        if (!isOnSharedDrives) return failure('File not found', 404)
        if (failingSteps.has('sheets')) return failure('down')
        let sheet = add(
          {
            appProperties: body.appProperties ?? {},
            content: null,
            copiedFrom: null,
            mimeType: SPREADSHEET_TYPE,
            name: body.name,
            parentId: body.parents[0] ?? '',
          },
          'sheet',
        )
        spreadsheets.set(sheet.id, { id: sheet.id, lists: [emptyList(0, 'List 1')] })
        return done('sheets', sheet.id)
      }
      if (failingNames.has(body.name) || failingSteps.has('folder')) return failure('down')

      let folder = add(
        {
          appProperties: body.appProperties ?? {},
          content: null,
          copiedFrom: null,
          mimeType: FOLDER_TYPE,
          name: body.name,
          parentId: body.parents[0] ?? '',
        },
        'folder',
      )
      if (losingNames.has(body.name)) {
        losingNames.delete(body.name)
        return failure('lost')
      }
      return done('folder', folder.id)
    }

    let copy = /^\/drive\/v3\/files\/([^/]+)\/copy$/.exec(url.pathname)
    if (method === 'POST' && copy !== null) {
      let template = files.get(decodeURIComponent(copy[1] ?? ''))
      if (template === undefined || !isOnSharedDrives) return failure('File not found', 404)
      if (failingSteps.has('copy')) return failure('down')
      let body = JSON.parse(String(init?.body)) as {
        appProperties?: Record<string, string>
        name: string
        parents: string[]
      }
      let doc = add(
        {
          appProperties: body.appProperties ?? {},
          content: null,
          copiedFrom: template.id,
          mimeType: template.mimeType,
          name: body.name,
          parentId: body.parents[0] ?? '',
        },
        'doc',
      )
      return done('copy', doc.id)
    }

    if (method === 'GET' && url.pathname === '/drive/v3/files') {
      if (!isOnSharedDrives || url.searchParams.get('includeItemsFromAllDrives') !== 'true') {
        return failure('File not found', 404)
      }
      let query = url.searchParams.get('q') ?? ''
      let parent = /^'([^']*)' in parents/.exec(query)?.[1]
      let tagged = /appProperties has \{ key='([^']+)' and value='((?:[^'\\]|\\.)*)' \}/.exec(query)
      if (tagged !== null) {
        let [, key = '', value = ''] = tagged
        let found = [...files.values()].filter(
          (file) => file.parentId === parent && file.appProperties[key] === value,
        )
        return Response.json({
          files: found.map((file) => ({ id: file.id, trashed: isBinned(file) })),
        })
      }
      let name = /name = '((?:[^'\\]|\\.)*)'/.exec(query)?.[1]?.replace(/\\(.)/g, '$1')
      if (name === undefined) {
        /* Every child not in the bin, as the walk over an issue's folders asks. */
        let children = [...files.values()].filter(
          (file) => file.parentId === parent && !isBinned(file),
        )
        return Response.json({
          files: children.map((file) => ({
            appProperties: file.appProperties,
            id: file.id,
            mimeType: file.mimeType,
            name: file.name,
          })),
        })
      }
      let found = [...files.values()].filter(
        (file) =>
          file.mimeType === FOLDER_TYPE &&
          file.parentId === parent &&
          file.name === name &&
          !isBinned(file),
      )
      return Response.json({ files: found.map((file) => ({ id: file.id })) })
    }

    let exported = /^\/drive\/v3\/files\/([^/]+)\/export$/.exec(url.pathname)
    if (method === 'GET' && exported !== null) {
      let doc = files.get(decodeURIComponent(exported[1] ?? ''))
      if (doc === undefined || isBinned(doc)) return failure('File not found', 404)
      if (url.searchParams.get('mimeType') !== 'application/pdf') return failure('bad export', 400)
      if (failingSteps.has('export')) return failure('down')
      return new Response(fakePdfOf(doc.id, doc.content ?? ''), {
        headers: { 'Content-Type': 'application/pdf' },
      })
    }

    let revised = /^\/drive\/v3\/files\/([^/]+)\/revisions$/.exec(url.pathname)
    if (method === 'GET' && revised !== null) {
      let id = decodeURIComponent(revised[1] ?? '')
      if (!files.has(id)) return failure('File not found', 404)
      if (failingSteps.has('revisions')) return failure('down')
      return Response.json({
        revisions: (revisions.get(id) ?? []).map((at) => ({ modifiedTime: at.toString() })),
      })
    }

    let listed = /^\/drive\/v3\/files\/([^/]+)\/permissions$/.exec(url.pathname)
    if (method === 'GET' && listed !== null) {
      let id = decodeURIComponent(listed[1] ?? '')
      if (!files.has(id) || !isOnSharedDrives) return failure('File not found', 404)
      if (failingSteps.has('permissions')) return failure('down')
      return Response.json({ permissions: permissions.get(id) ?? [] })
    }

    let match = /^\/drive\/v3\/files\/([^/]+)$/.exec(url.pathname)
    if (method === 'PATCH' && match !== null) {
      let file = files.get(decodeURIComponent(match[1] ?? ''))
      if (file === undefined || !isOnSharedDrives) return failure('File not found', 404)
      let body = JSON.parse(String(init?.body)) as { name?: string; trashed?: boolean }
      if (body.name !== undefined) {
        if (failingSteps.has('rename')) return failure('down')
        file.name = body.name
        return done('rename', file.id)
      }
      if (failingSteps.has('trash')) return failure('down')
      if (body.trashed === false) {
        if (isRestoreFailing) return failure('down')
        file.isTrashed = false
        return Response.json({ id: file.id })
      }
      if (body.trashed === true) {
        if (failingTrashes.has(file.id)) return failure('down')
        file.isTrashed = true
        return done('trash', file.id)
      }
      return Response.json({ id: file.id })
    }

    if (method === 'GET' && match !== null) {
      let file = files.get(decodeURIComponent(match[1] ?? ''))
      if (file === undefined || !isOnSharedDrives) return failure('File not found', 404)
      if (url.searchParams.get('alt') === 'media') {
        return new Response(file.bytes ?? new TextEncoder().encode(file.content ?? ''))
      }
      let isImage = file.mimeType.startsWith('image/')
      let owner = owners.get(file.id)
      return Response.json({
        id: file.id,
        owners: owner === undefined ? [] : [{ emailAddress: owner }],
        parents: [file.parentId],
        thumbnailLink: isImage ? `https://${THUMBNAIL_HOST}/thumb/${file.id}=s220` : undefined,
        explicitlyTrashed: file.isTrashed,
        modifiedTime: modifiedTimes.get(file.id)?.toString(),
        trashed: isBinned(file),
      })
    }

    return failure('unexpected call', 400)
  }

  return {
    calls,
    failCreate: (name) => void failingNames.add(name),
    failRestore() {
      isRestoreFailing = true
    },
    failStep: (step) => void failingSteps.add(step),
    reviseDoc(id, at) {
      revisions.set(id, [...(revisions.get(id) ?? []), at])
      modifiedTimes.set(id, at)
    },
    touch: (id, at) => void modifiedTimes.set(id, at),
    failTrashOf: (id) => void failingTrashes.add(id),
    failRewriteOf: (id) => void failingRewrites.add(id),
    fetch,
    files: () => [...files.values()],
    folders: () =>
      [...files.values()]
        .filter((file) => file.mimeType === FOLDER_TYPE)
        .map(({ id, isTrashed, name, parentId }) => ({ id, isTrashed, name, parentId })),
    goDown() {
      isDown = true
    },
    heal() {
      isDown = false
      failingNames.clear()
      failingSteps.clear()
      failingTrashes.clear()
      failingRewrites.clear()
      isRestoreFailing = false
    },
    loseReplyOnCreate: (name) => void losingNames.add(name),
    loseReplyOnStep: (step) => void losingSteps.add(step),
    move(id, parentId) {
      let file = files.get(id)
      if (file !== undefined) file.parentId = parentId
    },
    remove: (id) => void files.delete(id),
    restore(id) {
      let file = files.get(id)
      if (file !== undefined) file.isTrashed = false
    },
    seedFolder(id, name, parentId) {
      files.set(id, {
        appProperties: {},
        bytes: null,
        content: null,
        copiedFrom: null,
        id,
        isTrashed: false,
        mimeType: FOLDER_TYPE,
        name,
        parentId,
        replacements: [],
      })
    },
    seedDoc(id, name, parentId) {
      files.set(id, {
        appProperties: {},
        bytes: null,
        content: null,
        copiedFrom: null,
        id,
        isTrashed: false,
        mimeType: DOC_TYPE,
        name,
        parentId,
        replacements: [],
      })
    },
    seedTemplate(id, name) {
      files.set(id, {
        appProperties: {},
        bytes: null,
        content: null,
        copiedFrom: null,
        id,
        isTrashed: false,
        mimeType: DOC_TYPE,
        name,
        parentId: 'fake-templates',
        replacements: [],
      })
    },
    seedSpreadsheet(id, name, lists) {
      owners.set(id, FAKE_SPREADSHEET_OWNER)
      files.set(id, {
        appProperties: {},
        bytes: null,
        content: null,
        copiedFrom: null,
        id,
        isTrashed: false,
        mimeType: SPREADSHEET_TYPE,
        name,
        parentId: 'fake-registry-folder',
        replacements: [],
      })
      spreadsheets.set(id, {
        id,
        lists: lists.map((list, index) => ({
          ...emptyList(index, list.title),
          cells: list.cells.map((row) => [...row]),
        })),
      })
    },
    share(id, permission) {
      permissions.set(id, [...(permissions.get(id) ?? []), permission])
    },
    spreadsheet: (id) => spreadsheets.get(id),
    protect(spreadsheetId, title, protection) {
      let list = spreadsheets
        .get(spreadsheetId)
        ?.lists.find((candidate) => candidate.title === title)
      list?.protections.push({ ...protection, id: next++ })
    },
    trash(id) {
      let file = files.get(id)
      if (file !== undefined) file.isTrashed = true
    },
  }
}
