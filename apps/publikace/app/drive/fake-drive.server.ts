/**
 * Google as the suite sees it: the token endpoint and the folder calls of Drive, answered from
 * memory. Handed to the app as its `fetch`, so no test reaches Google.
 */

export type FakeFolder = { id: string; name: string; parentId: string; isTrashed: boolean }

export type FakeDrive = {
  /** Every call that reached the fake, as `METHOD path`. */
  calls: string[]
  fetch: typeof globalThis.fetch
  /** Creating a folder of this name answers 503 until `heal()`. */
  failCreate(name: string): void
  folders(): FakeFolder[]
  /** Every Drive call throws, as an unreachable network would. The token still answers. */
  goDown(): void
  heal(): void
  /** Creates the folder but answers 503, as a reply lost on the way back would. */
  loseReplyOnCreate(name: string): void
  remove(id: string): void
  trash(id: string): void
}

export function createFakeDrive(): FakeDrive {
  let folders = new Map<string, FakeFolder>()
  let failing = new Set<string>()
  let losing = new Set<string>()
  let isDown = false
  let next = 1
  let calls: string[] = []

  let fetch: typeof globalThis.fetch = async (input, init) => {
    let url = new URL(input instanceof Request ? input.url : String(input))
    let method = init?.method ?? 'GET'
    calls.push(`${method} ${url.pathname}`)

    if (url.hostname === 'oauth2.googleapis.com') {
      return Response.json({ access_token: 'test-access-token', expires_in: 3599 })
    }
    if (isDown) throw new TypeError('fetch failed')

    if (method === 'POST' && url.pathname === '/drive/v3/files') {
      let body = JSON.parse(String(init?.body)) as { name: string; parents: string[] }
      if (failing.has(body.name))
        return Response.json({ error: { message: 'down' } }, { status: 503 })

      let id = `fake-folder-${next++}`
      folders.set(id, { id, isTrashed: false, name: body.name, parentId: body.parents[0] ?? '' })
      if (losing.has(body.name)) {
        losing.delete(body.name)
        return Response.json({ error: { message: 'lost' } }, { status: 503 })
      }
      return Response.json({ id })
    }

    /* Drive answers 404 for a file on a shared drive asked for without these, so the fake does
       too: a call that forgets them fails here as it would there. */
    let isOnSharedDrives = url.searchParams.get('supportsAllDrives') === 'true'

    if (method === 'GET' && url.pathname === '/drive/v3/files') {
      if (!isOnSharedDrives || url.searchParams.get('includeItemsFromAllDrives') !== 'true') {
        return Response.json({ error: { message: 'File not found' } }, { status: 404 })
      }
      let query = url.searchParams.get('q') ?? ''
      let parent = /^'([^']*)' in parents/.exec(query)?.[1]
      let name = /name = '((?:[^'\\]|\\.)*)'/.exec(query)?.[1]?.replace(/\\(.)/g, '$1')
      let found = [...folders.values()].filter(
        (folder) => folder.parentId === parent && folder.name === name && !folder.isTrashed,
      )
      return Response.json({ files: found.map((folder) => ({ id: folder.id })) })
    }

    let match = /^\/drive\/v3\/files\/([^/]+)$/.exec(url.pathname)
    if (method === 'GET' && match !== null) {
      let folder = folders.get(decodeURIComponent(match[1] ?? ''))
      if (folder === undefined || !isOnSharedDrives)
        return Response.json({ error: { message: 'File not found' } }, { status: 404 })
      return Response.json({ id: folder.id, trashed: folder.isTrashed })
    }

    return Response.json({ error: { message: 'unexpected call' } }, { status: 400 })
  }

  return {
    calls,
    fetch,
    failCreate: (name) => void failing.add(name),
    folders: () => [...folders.values()],
    goDown() {
      isDown = true
    },
    heal() {
      isDown = false
      failing.clear()
    },
    loseReplyOnCreate: (name) => void losing.add(name),
    remove: (id) => void folders.delete(id),
    trash(id) {
      let folder = folders.get(id)
      if (folder !== undefined) folder.isTrashed = true
    },
  }
}
