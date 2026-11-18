import { logDriveFailure } from './log.server.ts'

const FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files'
const FOLDER_TYPE = 'application/vnd.google-apps.folder'

export type FolderCreated = { id: string; ok: true } | { ok: false }

/** `gone` covers a folder deleted for good and one in the bin alike: neither is usable. */
export type FolderPresence = 'exists' | 'gone' | 'unavailable'

export type FoundFolder = { id: string | null; ok: true } | { ok: false }

/**
 * The three calls creating an issue needs, on the shared drive _Publikace_ as `publikace.app@`.
 *
 * Every answer other than the expected one is _Disk teď neodpovídá_ to the person (`11c`) and a
 * line in the log for whoever reads it: a refused permission or a wrong `ISSUES_FOLDER_ID` is
 * not something an editor-in-chief can mend from the dialog.
 */
export type DriveFolders = {
  create(parentId: string, name: string): Promise<FolderCreated>
  /** A folder of that name directly in the parent, not in the bin; the first if several. */
  findChild(parentId: string, name: string): Promise<FoundFolder>
  presence(folderId: string): Promise<FolderPresence>
}

export type DriveFoldersOptions = {
  accessToken: string
  fetch?: typeof globalThis.fetch
}

export function createDriveFolders(options: DriveFoldersOptions): DriveFolders {
  let fetch = options.fetch ?? globalThis.fetch
  let headers = { Authorization: `Bearer ${options.accessToken}` }

  async function call(what: string, url: URL, init: RequestInit = {}): Promise<Response | null> {
    try {
      return await fetch(url, { ...init, headers: { ...headers, ...init.headers } })
    } catch (error) {
      logDriveFailure(what, error instanceof Error ? error.message : 'unknown error')
      return null
    }
  }

  return {
    async create(parentId, name) {
      let url = new URL(FILES_ENDPOINT)
      url.searchParams.set('supportsAllDrives', 'true')
      url.searchParams.set('fields', 'id')

      let response = await call('a folder was not created', url, {
        body: JSON.stringify({ mimeType: FOLDER_TYPE, name, parents: [parentId] }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      if (response === null) return { ok: false }

      let body = await readJson(response)
      if (response.ok && typeof body['id'] === 'string') return { id: body['id'], ok: true }

      logDriveFailure('a folder was not created', describe(response, body))
      return { ok: false }
    },

    async findChild(parentId, name) {
      let url = new URL(FILES_ENDPOINT)
      url.searchParams.set(
        'q',
        `'${escapeQuery(parentId)}' in parents and name = '${escapeQuery(name)}' and mimeType = '${FOLDER_TYPE}' and trashed = false`,
      )
      url.searchParams.set('fields', 'files(id)')
      url.searchParams.set('supportsAllDrives', 'true')
      url.searchParams.set('includeItemsFromAllDrives', 'true')
      url.searchParams.set('pageSize', '1')

      let response = await call('a folder was not looked up', url)
      if (response === null) return { ok: false }

      let body = await readJson(response)
      let files = body['files']
      if (!response.ok || !Array.isArray(files)) {
        logDriveFailure('a folder was not looked up', describe(response, body))
        return { ok: false }
      }

      let first: unknown = files[0]
      let id =
        typeof first === 'object' && first !== null ? (first as { id?: unknown }).id : undefined
      return { id: typeof id === 'string' ? id : null, ok: true }
    },

    async presence(folderId) {
      let url = new URL(`${FILES_ENDPOINT}/${encodeURIComponent(folderId)}`)
      url.searchParams.set('fields', 'id,trashed')
      url.searchParams.set('supportsAllDrives', 'true')

      let response = await call('a folder was not checked', url)
      if (response === null) return 'unavailable'
      if (response.status === 404) return 'gone'

      let body = await readJson(response)
      if (response.ok) return body['trashed'] === true ? 'gone' : 'exists'

      logDriveFailure('a folder was not checked', describe(response, body))
      return 'unavailable'
    },
  }
}

/** Drive's query language quotes with `'` and escapes it and `\` with a backslash. */
function escapeQuery(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  try {
    let value: unknown = await response.json()
    return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

function describe(response: Response, body: Record<string, unknown>): string {
  let error = body['error']
  let message =
    typeof error === 'object' && error !== null ? (error as { message?: unknown }).message : null
  return `HTTP ${response.status} ${typeof message === 'string' ? message : ''}`
}
