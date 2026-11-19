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
 * resumable one (an artwork, a licence PDF), `import` a Doc made from HTML.
 */
export const FAKE_STEPS = [
  'copy',
  'export',
  'folder',
  'import',
  'permissions',
  'preview',
  'replace',
  'store',
  'trash',
  'upload',
] as const

export type FakeStep = (typeof FAKE_STEPS)[number]

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
  /** A folder that exists already, as an article's does once the article page made it. */
  seedFolder(id: string, name: string, parentId: string): void
  /** A Doc that exists already, as a copy somebody made of an article's Doc. */
  seedDoc(id: string, name: string, parentId: string): void
  /** A file to copy from, as the article template is on the shared drive. */
  seedTemplate(id: string, name: string): void
  /** Adds a grant to a file, as somebody sharing it would; a file starts with none. */
  share(id: string, permission: FakePermission): void
  trash(id: string): void
}

const FOLDER_TYPE = 'application/vnd.google-apps.folder'
const DOC_TYPE = 'application/vnd.google-apps.document'
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
  let isRestoreFailing = false
  let losingSteps = new Set<FakeStep>()
  let isDown = false
  let next = 1
  let calls: string[] = []
  let permissions = new Map<string, FakePermission[]>()
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

    if (url.hostname === THUMBNAIL_HOST) {
      if (failingSteps.has('preview')) return failure('down')
      return new Response(FAKE_THUMBNAIL, { headers: { 'Content-Type': 'image/png' } })
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
        name: string
        parents: string[]
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
      if (failingSteps.has('trash')) return failure('down')
      let body = JSON.parse(String(init?.body)) as { trashed?: boolean }
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
      return Response.json({
        id: file.id,
        parents: [file.parentId],
        thumbnailLink: isImage ? `https://${THUMBNAIL_HOST}/thumb/${file.id}=s220` : undefined,
        explicitlyTrashed: file.isTrashed,
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
    failTrashOf: (id) => void failingTrashes.add(id),
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
    share(id, permission) {
      permissions.set(id, [...(permissions.get(id) ?? []), permission])
    },
    trash(id) {
      let file = files.get(id)
      if (file !== undefined) file.isTrashed = true
    },
  }
}
