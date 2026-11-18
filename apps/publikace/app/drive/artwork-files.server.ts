import {
  type ArticleFiles,
  ATTEMPT_PROPERTY,
  createArticleFiles,
  type FileCreated,
} from './article-files.server.ts'
import {
  createDriveCall,
  describe,
  FILES_ENDPOINT,
  idOf,
  readJson,
  UPLOAD_ENDPOINT,
} from './http.server.ts'
import { logDriveFailure } from './log.server.ts'

/**
 * The calls artworks need on the shared drive _Publikace_ as `publikace.app@`: storing an uploaded
 * file, the licence of each artwork as a temporary Doc made from HTML and exported to PDF, the
 * PDF stored beside it, the downscaled preview, and where a file is before it goes to the bin.
 *
 * Every file carries a key in `appProperties` under the same property as an article's files: an
 * upload its own upload key, a licence and its temporary Doc the batch's form key. A reply Drive
 * lost on the way back then leaves a file the cleanup can still find by that key.
 */

const DOC_TYPE = 'application/vnd.google-apps.document'

/** Bytes on their own buffer, which is what a request body takes. */
export type Bytes = Uint8Array<ArrayBuffer>

/** Where a file is: its parents, or `gone` for one deleted or in the bin. */
export type FilePlace =
  | { kind: 'gone' }
  | { kind: 'unavailable' }
  | { kind: 'here'; parents: string[] }

export type Preview = { bytes: Bytes; mimeType: string }

export type ArtworkFiles = Pick<ArticleFiles, 'findTagged' | 'trash'> & {
  /** The Doc exported as PDF, or `null` when Drive failed. */
  exportPdf(docId: string): Promise<Bytes | null>
  /** A Doc made by Drive from HTML, tagged with the key. */
  importHtmlAsDoc(parentId: string, name: string, html: string, key: string): Promise<FileCreated>
  placeOf(fileId: string): Promise<FilePlace>
  /**
   * The file's own thumbnail, at most this many pixels on the long side, as Drive renders it for
   * every image type it reads, HEIC and TIFF included. `null` when Drive has none.
   */
  previewOf(fileId: string, size: number): Promise<Preview | null>
  /** A file's bytes, for attaching a stored PDF to a resent request. */
  read(fileId: string): Promise<Bytes | null>
  /** Stores bytes as a file in one resumable session, which takes any size Drive allows. */
  upload(
    parentId: string,
    name: string,
    mimeType: string,
    bytes: Bytes,
    key: string,
  ): Promise<FileCreated>
}

export type ArtworkFilesOptions = {
  accessToken: string
  fetch?: typeof globalThis.fetch
}

function created(id: string | null): FileCreated {
  return id === null ? { ok: false } : { id, ok: true }
}

export function createArtworkFiles(options: ArtworkFilesOptions): ArtworkFiles {
  let fetch = options.fetch ?? globalThis.fetch
  let call = createDriveCall(options.accessToken, fetch)
  let shared = createArticleFiles({ accessToken: options.accessToken, fetch })

  async function bytesOf(what: string, response: Response | null): Promise<Bytes | null> {
    if (response === null) return null
    if (!response.ok) {
      logDriveFailure(what, describe(response, await readJson(response)))
      return null
    }
    try {
      return new Uint8Array(await response.arrayBuffer())
    } catch (error) {
      logDriveFailure(what, error instanceof Error ? error.message : 'unknown error')
      return null
    }
  }

  return {
    findTagged: shared.findTagged,
    trash: shared.trash,

    async exportPdf(docId) {
      let what = 'a licence was not exported to PDF'
      let url = new URL(`${FILES_ENDPOINT}/${encodeURIComponent(docId)}/export`)
      url.searchParams.set('mimeType', 'application/pdf')
      return bytesOf(what, await call(what, url))
    },

    async importHtmlAsDoc(parentId, name, html, key) {
      let what = 'a licence Doc was not made'
      let url = new URL(UPLOAD_ENDPOINT)
      url.searchParams.set('uploadType', 'multipart')
      url.searchParams.set('supportsAllDrives', 'true')
      url.searchParams.set('fields', 'id')
      let boundary = `publikace-${crypto.randomUUID()}`
      let metadata = JSON.stringify({
        appProperties: { [ATTEMPT_PROPERTY]: key },
        mimeType: DOC_TYPE,
        name,
        parents: [parentId],
      })
      let payload = [
        `--${boundary}`,
        'Content-Type: application/json; charset=UTF-8',
        '',
        metadata,
        `--${boundary}`,
        'Content-Type: text/html; charset=UTF-8',
        '',
        html,
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

    async placeOf(fileId) {
      let what = 'a file was not checked'
      let url = new URL(`${FILES_ENDPOINT}/${encodeURIComponent(fileId)}`)
      url.searchParams.set('fields', 'id,parents,trashed')
      url.searchParams.set('supportsAllDrives', 'true')
      let response = await call(what, url)
      if (response === null) return { kind: 'unavailable' }
      if (response.status === 404) return { kind: 'gone' }
      let body = await readJson(response)
      if (!response.ok) {
        logDriveFailure(what, describe(response, body))
        return { kind: 'unavailable' }
      }
      if (body['trashed'] === true) return { kind: 'gone' }
      let parents = Array.isArray(body['parents'])
        ? body['parents'].filter((id): id is string => typeof id === 'string')
        : []
      return { kind: 'here', parents }
    },

    async previewOf(fileId, size) {
      let what = 'a preview was not read'
      let url = new URL(`${FILES_ENDPOINT}/${encodeURIComponent(fileId)}`)
      url.searchParams.set('fields', 'thumbnailLink')
      url.searchParams.set('supportsAllDrives', 'true')
      let response = await call(what, url)
      if (response === null) return null
      let body = await readJson(response)
      let link = body['thumbnailLink']
      if (!response.ok || typeof link !== 'string') return null
      /* The link ends with its size, `=s220`; the same address serves any other. */
      let sized = link.replace(/=s\d+$/, `=s${size}`)
      let image = await call(what, new URL(sized))
      let bytes = await bytesOf(what, image)
      if (image === null || bytes === null) return null
      return { bytes, mimeType: image.headers.get('Content-Type') ?? 'image/png' }
    },

    async read(fileId) {
      let what = 'a stored licence was not read'
      let url = new URL(`${FILES_ENDPOINT}/${encodeURIComponent(fileId)}`)
      url.searchParams.set('alt', 'media')
      url.searchParams.set('supportsAllDrives', 'true')
      return bytesOf(what, await call(what, url))
    },

    async upload(parentId, name, mimeType, bytes, key) {
      let what = 'a file was not stored'
      let url = new URL(UPLOAD_ENDPOINT)
      url.searchParams.set('uploadType', 'resumable')
      url.searchParams.set('supportsAllDrives', 'true')
      url.searchParams.set('fields', 'id')
      let session = await call(what, url, {
        body: JSON.stringify({
          appProperties: { [ATTEMPT_PROPERTY]: key },
          mimeType,
          name,
          parents: [parentId],
        }),
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Length': String(bytes.byteLength),
          'X-Upload-Content-Type': mimeType,
        },
        method: 'POST',
      })
      if (session === null) return { ok: false }
      let location = session.headers.get('Location')
      if (!session.ok || location === null) {
        logDriveFailure(what, describe(session, await readJson(session)))
        return { ok: false }
      }
      let response = await call(what, new URL(location), {
        body: bytes,
        headers: { 'Content-Type': mimeType },
        method: 'PUT',
      })
      return created(await idOf(what, response))
    },
  }
}
