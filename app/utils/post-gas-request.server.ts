/**
 * Minimal typed JSON POST helper for the Google Apps Script web apps
 * (magic-link, editorial-board, …). Centralizes the POST, fail-fast timeout,
 * and body parsing so callers get a typed result without an inline cast.
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

// The default, for the best-effort senders: fail fast if GAS hangs, so delivery
// never stalls the caller's (neutral) response. A caller carrying a file passes
// its own `timeoutMilliseconds`.
const GAS_TIMEOUT_MS = 8000

export type GasRequestResult<TData> = {
  ok: boolean
  status: number
  data: TData | null
}

export type GasRequestOptions = {
  /**
   * How long to wait before aborting. Defaults to 8 s, right for a sign-in link;
   * a request that carries a file (a scanned declaration, ~10.7 MB once
   * base64-encoded) needs far longer.
   */
  timeoutMilliseconds?: number
}

export const postGasRequest = async <TData>(
  url: string,
  body: unknown,
  options: GasRequestOptions = {},
): Promise<GasRequestResult<TData>> => {
  const response = await fetch(url, {
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
    signal: AbortSignal.timeout(options.timeoutMilliseconds ?? GAS_TIMEOUT_MS),
  })

  const data = (await response.json().catch(() => null)) as TData | null

  return { data, ok: response.ok, status: response.status }
}
