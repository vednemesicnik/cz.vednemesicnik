/**
 * Google as the suite sees it: the token endpoint, Drive's files and the Docs call that writes an
 * article's name, answered from memory. Handed to the app as its `fetch`, so no test reaches
 * Google.
 */

export type FakeFolder = { id: string; name: string; parentId: string; isTrashed: boolean }

/** Any file the fake holds; a folder is one with the folder type. */
export type FakeFile = FakeFolder & {
  appProperties: Record<string, string>
  /** The uploaded text, for `_meta.json`. */
  content: string | null
  /** The template a copy came from. */
  copiedFrom: string | null
  mimeType: string
  /** What `replaceAllText` wrote into a Doc, in order. */
  replacements: { text: string; with: string }[]
}

/** One kind of call an article needs, for failing it on purpose. */
export type FakeStep = 'copy' | 'folder' | 'replace' | 'trash' | 'upload'

export type FakeDrive = {
  /** Every call that reached the fake, as `METHOD path`. */
  calls: string[]
  /** Creating a folder of this name answers 503 until `heal()`. */
  failCreate(name: string): void
  /** Every call of this kind answers 503 until `heal()`. */
  failStep(step: FakeStep): void
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
  remove(id: string): void
  /** A file to copy from, as the article template is on the shared drive. */
  seedTemplate(id: string, name: string): void
  trash(id: string): void
}

const FOLDER_TYPE = 'application/vnd.google-apps.folder'
const DOC_TYPE = 'application/vnd.google-apps.document'

function failure(message: string, status = 503): Response {
  return Response.json({ error: { message } }, { status })
}

export function createFakeDrive(): FakeDrive {
  let files = new Map<string, FakeFile>()
  let failingNames = new Set<string>()
  let losingNames = new Set<string>()
  let failingSteps = new Set<FakeStep>()
  let losingSteps = new Set<FakeStep>()
  let isDown = false
  let next = 1
  let calls: string[] = []

  function add(
    file: Omit<FakeFile, 'id' | 'isTrashed' | 'replacements'>,
    prefix: string,
  ): FakeFile {
    let id = `fake-${prefix}-${next++}`
    let stored: FakeFile = { ...file, id, isTrashed: false, replacements: [] }
    files.set(id, stored)
    return stored
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

    if (method === 'POST' && url.pathname === '/upload/drive/v3/files') {
      if (!isOnSharedDrives || url.searchParams.get('uploadType') !== 'multipart') {
        return failure('bad upload', 400)
      }
      if (failingSteps.has('upload')) return failure('down')
      let parts = String(init?.body).split(/\r\n--[^\r\n]+/)
      let metadata = JSON.parse(parts[0]?.split('\r\n\r\n')[1] ?? '{}') as {
        appProperties?: Record<string, string>
        mimeType?: string
        name: string
        parents: string[]
      }
      let content = parts[1]?.split('\r\n\r\n').slice(1).join('\r\n\r\n') ?? ''
      let file = add(
        {
          appProperties: metadata.appProperties ?? {},
          content,
          copiedFrom: null,
          mimeType: metadata.mimeType ?? 'text/plain',
          name: metadata.name,
          parentId: metadata.parents[0] ?? '',
        },
        'file',
      )
      return done('upload', file.id)
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
          files: found.map((file) => ({ id: file.id, trashed: file.isTrashed })),
        })
      }
      let name = /name = '((?:[^'\\]|\\.)*)'/.exec(query)?.[1]?.replace(/\\(.)/g, '$1')
      let found = [...files.values()].filter(
        (file) =>
          file.mimeType === FOLDER_TYPE &&
          file.parentId === parent &&
          file.name === name &&
          !file.isTrashed,
      )
      return Response.json({ files: found.map((file) => ({ id: file.id })) })
    }

    let match = /^\/drive\/v3\/files\/([^/]+)$/.exec(url.pathname)
    if (method === 'PATCH' && match !== null) {
      let file = files.get(decodeURIComponent(match[1] ?? ''))
      if (file === undefined || !isOnSharedDrives) return failure('File not found', 404)
      if (failingSteps.has('trash')) return failure('down')
      let body = JSON.parse(String(init?.body)) as { trashed?: boolean }
      if (body.trashed === true) file.isTrashed = true
      return Response.json({ id: file.id })
    }

    if (method === 'GET' && match !== null) {
      let file = files.get(decodeURIComponent(match[1] ?? ''))
      if (file === undefined || !isOnSharedDrives) return failure('File not found', 404)
      return Response.json({ id: file.id, trashed: file.isTrashed })
    }

    return failure('unexpected call', 400)
  }

  return {
    calls,
    failCreate: (name) => void failingNames.add(name),
    failStep: (step) => void failingSteps.add(step),
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
    },
    loseReplyOnCreate: (name) => void losingNames.add(name),
    loseReplyOnStep: (step) => void losingSteps.add(step),
    remove: (id) => void files.delete(id),
    seedTemplate(id, name) {
      files.set(id, {
        appProperties: {},
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
    trash(id) {
      let file = files.get(id)
      if (file !== undefined) file.isTrashed = true
    },
  }
}
