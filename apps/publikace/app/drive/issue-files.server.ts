import { type ArticleFiles, createArticleFiles } from './article-files.server.ts'
import { type ArtworkFiles, createArtworkFiles } from './artwork-files.server.ts'
import {
  createDriveCall,
  describe,
  escapeQuery,
  FILES_ENDPOINT,
  readJson,
  UPLOAD_ENDPOINT,
} from './http.server.ts'
import { logDriveFailure } from './log.server.ts'

/**
 * The calls renaming and removing an issue need (#151, `12v`, `12w`), on the shared drive
 * _Publikace_ as `publikace.app@`: a folder's new name, a `_meta.json` written over, the children
 * of a folder, where a file is, and the bin both ways. The bin and the upload are the article's
 * and the artworks' own calls.
 */

/** A file directly in a folder, as the walk over the issue's folders reads it. */
export type ChildFile = {
  appProperties: Record<string, string>
  id: string
  isFolder: boolean
  name: string
}

/**
 * Where a file is. `binned` is in the bin itself or under a folder that is; `deleted` is gone for
 * good or never reachable by the account, which Drive answers alike.
 */
export type FileLocation =
  | { kind: 'binned' }
  | { kind: 'deleted' }
  | { kind: 'here'; parents: string[] }
  | { kind: 'unavailable' }

export type IssueFiles = Pick<ArticleFiles, 'trash' | 'uploadJson'> &
  Pick<ArtworkFiles, 'restore'> & {
    /** Every file directly in the folder and not in the bin; `null` when Drive failed. */
    listChildren(folderId: string): Promise<ChildFile[] | null>
    locate(fileId: string): Promise<FileLocation>
    rename(fileId: string, name: string): Promise<boolean>
    /** Writes a text file's content anew, keeping its ID, its name and its tags. */
    replaceText(fileId: string, body: string): Promise<boolean>
  }

export type IssueFilesOptions = {
  accessToken: string
  fetch?: typeof globalThis.fetch
}

const FOLDER_TYPE = 'application/vnd.google-apps.folder'

export function createIssueFiles(options: IssueFilesOptions): IssueFiles {
  let fetch = options.fetch ?? globalThis.fetch
  let call = createDriveCall(options.accessToken, fetch)
  let articleFiles = createArticleFiles(options)
  let artworkFiles = createArtworkFiles(options)

  return {
    async listChildren(folderId) {
      let what = 'the files of a folder were not listed'
      let found: ChildFile[] = []
      let pageToken: string | null = null
      do {
        let url = new URL(FILES_ENDPOINT)
        url.searchParams.set('q', `'${escapeQuery(folderId)}' in parents and trashed = false`)
        url.searchParams.set('fields', 'nextPageToken,files(id,name,mimeType,appProperties)')
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
        for (let file of files as Record<string, unknown>[]) {
          if (typeof file['id'] !== 'string') continue
          let properties = file['appProperties']
          found.push({
            appProperties:
              typeof properties === 'object' && properties !== null
                ? (properties as Record<string, string>)
                : {},
            id: file['id'],
            isFolder: file['mimeType'] === FOLDER_TYPE,
            name: typeof file['name'] === 'string' ? file['name'] : '',
          })
        }
        let next = body['nextPageToken']
        pageToken = typeof next === 'string' && next !== '' ? next : null
      } while (pageToken !== null)
      return found
    },

    async locate(fileId) {
      let what = 'a file was not located'
      let url = new URL(`${FILES_ENDPOINT}/${encodeURIComponent(fileId)}`)
      url.searchParams.set('fields', 'id,parents,trashed')
      url.searchParams.set('supportsAllDrives', 'true')
      let response = await call(what, url)
      if (response === null) return { kind: 'unavailable' }
      if (response.status === 404) return { kind: 'deleted' }
      let body = await readJson(response)
      if (!response.ok) {
        logDriveFailure(what, describe(response, body))
        return { kind: 'unavailable' }
      }
      if (body['trashed'] === true) return { kind: 'binned' }
      let parents = Array.isArray(body['parents'])
        ? body['parents'].filter((id): id is string => typeof id === 'string')
        : []
      return { kind: 'here', parents }
    },

    async rename(fileId, name) {
      let what = 'a folder was not renamed'
      let url = new URL(`${FILES_ENDPOINT}/${encodeURIComponent(fileId)}`)
      url.searchParams.set('supportsAllDrives', 'true')
      url.searchParams.set('fields', 'id')
      let response = await call(what, url, {
        body: JSON.stringify({ name }),
        headers: { 'Content-Type': 'application/json' },
        method: 'PATCH',
      })
      if (response === null) return false
      if (response.ok) return true
      logDriveFailure(what, describe(response, await readJson(response)))
      return false
    },

    async replaceText(fileId, body) {
      let what = 'a _meta.json was not written'
      let url = new URL(`${UPLOAD_ENDPOINT}/${encodeURIComponent(fileId)}`)
      url.searchParams.set('uploadType', 'media')
      url.searchParams.set('supportsAllDrives', 'true')
      url.searchParams.set('fields', 'id')
      let response = await call(what, url, {
        body,
        headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
        method: 'PATCH',
      })
      if (response === null) return false
      if (response.ok) return true
      logDriveFailure(what, describe(response, await readJson(response)))
      return false
    },

    restore: (fileId) => artworkFiles.restore(fileId),
    trash: (fileId) => articleFiles.trash(fileId),
    uploadJson: (parentId, name, body, attempt) =>
      articleFiles.uploadJson(parentId, name, body, attempt),
  }
}
