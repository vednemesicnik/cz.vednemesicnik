import { logDriveFailure } from './log.server.ts'

/**
 * What every call to Google's file APIs shares: the bearer token, a network failure or a call
 * that does not answer within the timeout turned into a logged `null`, and an answer that is not
 * JSON read as an empty object. The timeout matters because a form's lock and the startup are both
 * held while a call waits.
 */

const TIMEOUT_MS = 30_000

export const FILES_ENDPOINT = 'https://www.googleapis.com/drive/v3/files'
export const UPLOAD_ENDPOINT = 'https://www.googleapis.com/upload/drive/v3/files'
export const DOCS_ENDPOINT = 'https://docs.googleapis.com/v1/documents'
export const FOLDER_TYPE = 'application/vnd.google-apps.folder'

export type DriveCall = (what: string, url: URL, init?: RequestInit) => Promise<Response | null>

export function createDriveCall(accessToken: string, fetch: typeof globalThis.fetch): DriveCall {
  let headers = { Authorization: `Bearer ${accessToken}` }
  return async (what, url, init = {}) => {
    try {
      return await fetch(url, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
        ...init,
        headers: { ...headers, ...init.headers },
      })
    } catch (error) {
      logDriveFailure(what, error instanceof Error ? error.message : 'unknown error')
      return null
    }
  }
}

export async function readJson(response: Response): Promise<Record<string, unknown>> {
  try {
    let value: unknown = await response.json()
    return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

export function describe(response: Response, body: Record<string, unknown>): string {
  let error = body['error']
  let message =
    typeof error === 'object' && error !== null ? (error as { message?: unknown }).message : null
  return `HTTP ${response.status} ${typeof message === 'string' ? message : ''}`
}

/** Drive's query language quotes with `'` and escapes it and `\` with a backslash. */
export function escapeQuery(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")
}

/** The ID in an answer that should carry one, or `null` after logging what came instead. */
export async function idOf(what: string, response: Response | null): Promise<string | null> {
  if (response === null) return null
  let body = await readJson(response)
  if (response.ok && typeof body['id'] === 'string') return body['id']
  logDriveFailure(what, describe(response, body))
  return null
}
