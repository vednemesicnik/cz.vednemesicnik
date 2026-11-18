import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { createDriveFolders } from './folders.server.ts'

function answering(status: number, body: unknown): typeof globalThis.fetch {
  return async () => Response.json(body, { status })
}

describe('the Drive folder calls', () => {
  it('creates a folder on the shared drive, with the token', async () => {
    let sent: { init?: RequestInit; url: string } | null = null
    let folders = createDriveFolders({
      accessToken: 'test-access-token',
      fetch: async (url, init) => {
        sent = { init, url: String(url) }
        return Response.json({ id: 'fake-folder-1' })
      },
    })

    assert.deepEqual(await folders.create('fake-parent', 'VDM_2026_6'), {
      id: 'fake-folder-1',
      ok: true,
    })
    let request = sent as { init?: RequestInit; url: string } | null
    assert.ok(request?.url.includes('supportsAllDrives=true'))
    assert.deepEqual(JSON.parse(String(request?.init?.body)), {
      mimeType: 'application/vnd.google-apps.folder',
      name: 'VDM_2026_6',
      parents: ['fake-parent'],
    })
    assert.equal(
      new Headers(request?.init?.headers).get('Authorization'),
      'Bearer test-access-token',
    )
  })

  it('reports a refusal, a server error and a lost network alike as not created', async () => {
    for (let fetch of [
      answering(403, { error: { message: 'Insufficient permissions' } }),
      answering(503, {}),
      async () => {
        throw new TypeError('fetch failed')
      },
    ]) {
      let folders = createDriveFolders({ accessToken: 'test', fetch })
      assert.deepEqual(await folders.create('fake-parent', 'Články'), { ok: false })
    }
  })

  it('asks with the shared-drive parameters, without which Drive answers 404', async () => {
    let urls: URL[] = []
    let folders = createDriveFolders({
      accessToken: 'test',
      fetch: async (url) => {
        urls.push(new URL(String(url)))
        return Response.json({ files: [], id: 'fake-folder-1', trashed: false })
      },
    })
    await folders.presence('fake-folder-1')
    await folders.findChild('fake-parent', 'Články')

    let [presence, list] = urls
    assert.equal(presence?.searchParams.get('supportsAllDrives'), 'true')
    assert.equal(list?.searchParams.get('supportsAllDrives'), 'true')
    assert.equal(list?.searchParams.get('includeItemsFromAllDrives'), 'true')
  })

  it('tells a folder in the bin or deleted from one that is there', async () => {
    let check = (fetch: typeof globalThis.fetch) =>
      createDriveFolders({ accessToken: 'test', fetch }).presence('fake-folder-1')

    assert.equal(await check(answering(200, { id: 'fake-folder-1', trashed: false })), 'exists')
    assert.equal(await check(answering(200, { id: 'fake-folder-1', trashed: true })), 'gone')
    assert.equal(await check(answering(404, { error: { message: 'File not found' } })), 'gone')
    assert.equal(await check(answering(500, {})), 'unavailable')
  })

  it('looks a child up by its name, quoting what Drive needs quoted', async () => {
    let query = ''
    let folders = createDriveFolders({
      accessToken: 'test',
      fetch: async (url) => {
        query = new URL(String(url)).searchParams.get('q') ?? ''
        return Response.json({ files: [{ id: 'fake-folder-2' }] })
      },
    })

    assert.deepEqual(await folders.findChild('fake-parent', "Rock'n'roll"), {
      id: 'fake-folder-2',
      ok: true,
    })
    assert.ok(query.includes("name = 'Rock\\'n\\'roll'"))
    assert.ok(query.includes('trashed = false'))

    let none = createDriveFolders({ accessToken: 'test', fetch: answering(200, { files: [] }) })
    assert.deepEqual(await none.findChild('fake-parent', 'Články'), { id: null, ok: true })
  })
})
