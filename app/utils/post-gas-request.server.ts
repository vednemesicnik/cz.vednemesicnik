/**
 * Minimal typed JSON POST helper for the Google Apps Script web apps
 * (magic-link, editorial-board, …). Centralizes the POST, fail-fast timeout,
 * and body parsing so callers get a typed result without an inline cast.
 *
 * `/exec` answers a POST with a 302 to `script.googleusercontent.com`, where the
 * output lives. The script has already run by then; the GET only collects what it
 * produced. This walks both hops itself: POSTs answered 404 about twice in fourteen
 * calls, always out of the automatic walk (#384). No cause was found, so each hop
 * gets its own log line and the next occurrence says which one failed.
 *
 * Network errors and timeouts propagate to the caller, which decides what they
 * mean: the e-mail senders log and swallow them, the membership application
 * reports them. A non-JSON body (e.g. a GAS HTML error page) yields
 * `data: null` while still reporting the HTTP status.
 *
 * The response type is a caller-supplied assertion (`as TData`) — the parsed
 * bytes are not validated at runtime. Callers pass the generated contract type
 * from `@generated/<name>/response`.
 */

import type { GasEndpointName } from '@constants/gas-endpoints'

// The default, for the best-effort senders: fail fast if GAS hangs, so a caller
// waiting on delivery does not stall for long. A caller carrying a file passes its
// own `timeoutMilliseconds`.
const GAS_TIMEOUT_MS = 8000

export type GasRequestResult<TData> = {
  ok: boolean
  status: number
  data: TData | null
}

export type GasRequestOptions = {
  /** Names the script in the log, where its URL does not belong. */
  endpoint: GasEndpointName
  /**
   * How long to wait before aborting both hops together. Defaults to 8 s, right
   * for a sign-in link; a request that carries a file (a scanned declaration,
   * ~10.7 MB once base64-encoded) needs far longer.
   */
  timeoutMilliseconds?: number
}

// Runs one hop and logs its outcome. `label` is the method, plus the host on the
// second hop: the `/exec` URL and the `user_content_key` in `Location` stay out of
// the log. Warnings rather than errors, because reporting a failure is the caller's.
const fetchHop = async (
  { endpoint, hop, label }: { endpoint: string; hop: 1 | 2; label: string },
  url: string | URL,
  requestInit: RequestInit,
): Promise<Response> => {
  const prefix = `[gas] ${endpoint} hop ${hop} ${label}`
  const startedAt = Date.now()

  try {
    const response = await fetch(url, requestInit)
    const line = `${prefix} → ${response.status} (${Date.now() - startedAt} ms)`

    if (response.status < 400) {
      console.info(line)
    } else {
      console.warn(line)
    }

    return response
  } catch (error) {
    const reason = error instanceof Error ? error.name : 'unknown error'
    console.warn(`${prefix} threw ${reason} (${Date.now() - startedAt} ms)`)
    throw error
  }
}

/**
 * POSTs `body` to a web app and reads the answer.
 *
 * @param url - The web app's `/exec` URL.
 * @param body - Serialised as JSON.
 * @param options - Which endpoint this is, and optionally how long to wait.
 * @returns The status and parsed body of the last hop.
 * @throws When a hop fails on the network or times out.
 */
export const postGasRequest = async <TData>(
  url: string,
  body: unknown,
  { endpoint, timeoutMilliseconds = GAS_TIMEOUT_MS }: GasRequestOptions,
): Promise<GasRequestResult<TData>> => {
  // One signal for both hops, so the bound is on the whole exchange.
  const signal = AbortSignal.timeout(timeoutMilliseconds)

  const firstResponse = await fetchHop(
    { endpoint, hop: 1, label: 'POST' },
    url,
    {
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      redirect: 'manual',
      signal,
    },
  )

  const location =
    firstResponse.status >= 300 && firstResponse.status < 400
      ? firstResponse.headers.get('location')
      : null

  // `parse` rather than `new URL`: a thrown error would carry both addresses into
  // whatever logs it. A `Location` it can't read is answered like a missing one.
  const secondUrl = location === null ? null : URL.parse(location, url)

  let response = firstResponse

  if (secondUrl !== null) {
    // An unread body would hold the connection open.
    await firstResponse.body?.cancel()

    // A GET of the output: there is no body to lose and reading writes nothing, so
    // following any further redirects here is safe.
    response = await fetchHop(
      { endpoint, hop: 2, label: `GET ${secondUrl.host}` },
      secondUrl,
      { redirect: 'follow', signal },
    )
  }

  const data = (await response.json().catch(() => null)) as TData | null

  return { data, ok: response.ok, status: response.status }
}
