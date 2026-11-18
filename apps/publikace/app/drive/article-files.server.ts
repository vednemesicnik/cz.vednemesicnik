import {
  createDriveCall,
  describe,
  DOCS_ENDPOINT,
  escapeQuery,
  FILES_ENDPOINT,
  FOLDER_TYPE,
  idOf,
  readJson,
  UPLOAD_ENDPOINT,
} from './http.server.ts'
import { logDriveFailure } from './log.server.ts'

/**
 * The calls creating an article needs, on the shared drive _Publikace_ as `publikace.app@`: its
 * folder, the copy of the template, the name in the copy, `_meta.json`, and the bin for an attempt
 * that failed (`11c`).
 *
 * Every file an attempt creates carries its form key in `appProperties`. A reply Drive lost on the
 * way back then leaves a file the cleanup can still find, by that key and never by a name another
 * article may share.
 */

/** The `appProperties` key the attempt's form key is kept under. */
export const ATTEMPT_PROPERTY = 'publikaceAttempt'

export type FileCreated = { id: string; ok: true } | { ok: false }

export type ArticleFiles = {
  copyFile(
    templateId: string,
    parentId: string,
    name: string,
    attempt: string,
  ): Promise<FileCreated>
  createFolder(parentId: string, name: string, attempt: string): Promise<FileCreated>
  /** Files in the parent carrying the attempt's key, in the bin or not; `null` if Drive failed. */
  findTagged(parentId: string, attempt: string): Promise<string[] | null>
  replaceText(docId: string, placeholder: string, value: string): Promise<boolean>
  /** Moves a file to the shared drive's bin; a file already gone counts as done. */
  trash(fileId: string): Promise<boolean>
  uploadJson(parentId: string, name: string, body: string, attempt: string): Promise<FileCreated>
}

export type ArticleFilesOptions = {
  accessToken: string
  fetch?: typeof globalThis.fetch
}

function created(id: string | null): FileCreated {
  return id === null ? { ok: false } : { id, ok: true }
}

export function createArticleFiles(options: ArticleFilesOptions): ArticleFiles {
  let call = createDriveCall(options.accessToken, options.fetch ?? globalThis.fetch)

  function filesUrl(path = ''): URL {
    let url = new URL(`${FILES_ENDPOINT}${path}`)
    url.searchParams.set('supportsAllDrives', 'true')
    url.searchParams.set('fields', 'id')
    return url
  }

  return {
    async copyFile(templateId, parentId, name, attempt) {
      let what = 'the article Doc was not copied'
      let response = await call(what, filesUrl(`/${encodeURIComponent(templateId)}/copy`), {
        body: JSON.stringify({
          appProperties: { [ATTEMPT_PROPERTY]: attempt },
          name,
          parents: [parentId],
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      return created(await idOf(what, response))
    },

    async createFolder(parentId, name, attempt) {
      let what = 'the article folder was not created'
      let response = await call(what, filesUrl(), {
        body: JSON.stringify({
          appProperties: { [ATTEMPT_PROPERTY]: attempt },
          mimeType: FOLDER_TYPE,
          name,
          parents: [parentId],
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      return created(await idOf(what, response))
    },

    async findTagged(parentId, attempt) {
      let what = 'the attempt files were not looked up'
      let found: string[] = []
      let pageToken: string | null = null
      /* Every page: a batch of artworks alone tags forty files, Docs and PDFs. */
      do {
        let url = new URL(FILES_ENDPOINT)
        url.searchParams.set(
          'q',
          `'${escapeQuery(parentId)}' in parents and appProperties has { key='${ATTEMPT_PROPERTY}' and value='${escapeQuery(attempt)}' } and trashed = false`,
        )
        url.searchParams.set('fields', 'nextPageToken,files(id,trashed)')
        url.searchParams.set('supportsAllDrives', 'true')
        url.searchParams.set('includeItemsFromAllDrives', 'true')
        url.searchParams.set('pageSize', '100')
        if (pageToken !== null) url.searchParams.set('pageToken', pageToken)

        let response = await call(what, url)
        if (response === null) return null
        let body = await readJson(response)
        let files = body['files']
        if (!response.ok || !Array.isArray(files)) {
          logDriveFailure(what, describe(response, body))
          return null
        }
        for (let file of files) {
          let id = typeof file === 'object' && file !== null ? (file as { id?: unknown }).id : null
          if (typeof id === 'string' && (file as { trashed?: unknown }).trashed !== true)
            found.push(id)
        }
        let next = body['nextPageToken']
        pageToken = typeof next === 'string' && next !== '' ? next : null
      } while (pageToken !== null)
      return found
    },

    async replaceText(docId, placeholder, value) {
      let what = 'the article name was not written into the Doc'
      let url = new URL(`${DOCS_ENDPOINT}/${encodeURIComponent(docId)}:batchUpdate`)
      let response = await call(what, url, {
        body: JSON.stringify({
          requests: [
            {
              replaceAllText: {
                containsText: { matchCase: true, text: placeholder },
                replaceText: value,
              },
            },
          ],
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      if (response === null) return false
      if (response.ok) return true
      logDriveFailure(what, describe(response, await readJson(response)))
      return false
    },

    async trash(fileId) {
      let what = 'a file of a failed attempt was not moved to the bin'
      let url = new URL(`${FILES_ENDPOINT}/${encodeURIComponent(fileId)}`)
      url.searchParams.set('supportsAllDrives', 'true')
      url.searchParams.set('fields', 'id')
      let response = await call(what, url, {
        body: JSON.stringify({ trashed: true }),
        headers: { 'Content-Type': 'application/json' },
        method: 'PATCH',
      })
      if (response === null) return false
      if (response.ok || response.status === 404) return true
      logDriveFailure(what, describe(response, await readJson(response)))
      return false
    },

    async uploadJson(parentId, name, body, attempt) {
      let what = 'the article metadata was not written'
      let url = new URL(UPLOAD_ENDPOINT)
      url.searchParams.set('uploadType', 'multipart')
      url.searchParams.set('supportsAllDrives', 'true')
      url.searchParams.set('fields', 'id')
      let boundary = `publikace-${crypto.randomUUID()}`
      let metadata = JSON.stringify({
        appProperties: { [ATTEMPT_PROPERTY]: attempt },
        mimeType: 'text/plain',
        name,
        parents: [parentId],
      })
      let payload = [
        `--${boundary}`,
        'Content-Type: application/json; charset=UTF-8',
        '',
        metadata,
        `--${boundary}`,
        'Content-Type: text/plain; charset=UTF-8',
        '',
        body,
        `--${boundary}--`,
        '',
      ].join('\r\n')
      let response = await call(what, url, {
        body: payload,
        headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
        method: 'POST',
      })
      return created(await idOf(what, response))
    },
  }
}
