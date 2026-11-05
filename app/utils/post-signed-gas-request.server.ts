/**
 * A signed request to a Google Apps Script web app that can try a transport blip
 * again. Ported from `cz.vednemesicnik.billing/app/gas/signed-request.server.ts`,
 * except that here the retry is opt-in and nothing is worded for a screen.
 *
 * The retry is opt-in because a fresh timestamp makes a retry a different envelope,
 * so only something inside the payload can tell the far end it has seen this work
 * before. Not every script can: `users-notice` keys its e-mail-change notice on the
 * request signature, so a retry would mail the person twice. Log 0061.
 */

import type { GasEndpointName } from '@constants/gas-endpoints'
import * as Sentry from '@sentry/react-router'

import { postGasRequest } from './post-gas-request.server'
import { readMailError } from './read-mail-error'
import { signGasRequest } from './sign-gas-request.server'

export type GasFailure = {
  ok: false
  error: string
  retryable: boolean
  status: number | null
  mailError?: string
  cause?: unknown
}

export type GasResult<TSuccess> = ({ ok: true } & TSuccess) | GasFailure

export type SignedGasEndpoint = {
  endpoint: GasEndpointName
  secret: string
  url: string
}

export type SignedGasRequestOptions<TRequest> = {
  idempotencyKeyField?: keyof TRequest & string
  timeoutMilliseconds?: number
}

type GasFailureBody = {
  error?: unknown
  mailError?: unknown
  mailerError?: unknown
  ok?: unknown
}

// Answers from the scripts that will not change by being asked again.
const SETTLED_ERRORS = new Set([
  'ambiguous',
  'invalid_request',
  'link_not_allowed',
  'missing_fields',
  'not_active',
  'not_found',
  'server_misconfigured',
  'stale_timestamp',
  'unauthorized',
])

// A timestamp counts whole seconds, so anything shorter could repeat the first
// attempt's timestamp and signature, and the retry would not be a fresh envelope.
const RETRY_DELAY_MILLISECONDS = 1000

// Anything unrecognised counts as transient: getting that wrong costs one wasted
// attempt, the other way round it turns a blip into a refusal.
const createGasFailure = (
  error: string,
  status: number | null,
  mailError?: string,
): GasFailure => ({
  error,
  ok: false,
  retryable: !SETTLED_ERRORS.has(error),
  status,
  ...(mailError === undefined ? {} : { mailError }),
})

const attemptRequest = async <TSuccess>(
  { endpoint, secret, url }: SignedGasEndpoint,
  request: object,
  timeoutMilliseconds: number | undefined,
): Promise<GasResult<TSuccess>> => {
  try {
    const { data, ok, status } = await postGasRequest<GasFailureBody>(
      url,
      // Inside the attempt, so every attempt gets its own timestamp.
      signGasRequest(secret, request),
      { endpoint, timeoutMilliseconds },
    )

    // Not an answer from the script: it always replies HTTP 200 with JSON, so this
    // is Google's error page or a broken deployment.
    if (!ok || data === null) {
      return createGasFailure('unreachable', status)
    }

    if (data.ok === true) {
      return data as { ok: true } & TSuccess
    }

    return createGasFailure(
      typeof data.error === 'string' ? data.error : 'server_error',
      status,
      readMailError(data),
    )
  } catch (error) {
    // Timeout, DNS, connection refused, or a bug on our side. The caller reports
    // `cause`, so a code error does not read as a Google outage.
    return { ...createGasFailure('unreachable', null), cause: error }
  }
}

/**
 * Signs `request`, posts it, and unwraps the answer. Never throws.
 *
 * Opt in to one retry only when the far end recognises a repeat by a field of the
 * payload; a key derived from the signature does not survive a retry. A rescued
 * attempt is reported to Sentry, since otherwise it leaves no trace past Fly's
 * short-lived logs and nobody learns whether the retry earns its keep.
 *
 * @param endpoint - Which web app, its URL and its signing key.
 * @param request - The request body, signed as one payload.
 * @param options - `idempotencyKeyField` names the field that identifies this unit
 *   of work and opts in to the retry; it needs a non-empty string there, or there
 *   is one attempt. `timeoutMilliseconds` applies to each attempt.
 * @returns The script's success body, or a failure saying whether it was retryable;
 *   `cause` holds the error when the last attempt threw.
 */
export const postSignedGasRequest = async <TSuccess, TRequest extends object>(
  endpoint: SignedGasEndpoint,
  request: TRequest,
  {
    idempotencyKeyField,
    timeoutMilliseconds,
  }: SignedGasRequestOptions<TRequest> = {},
): Promise<GasResult<TSuccess>> => {
  const idempotencyKey =
    idempotencyKeyField === undefined ? undefined : request[idempotencyKeyField]
  const canRetry = typeof idempotencyKey === 'string' && idempotencyKey !== ''

  const first = await attemptRequest<TSuccess>(
    endpoint,
    request,
    timeoutMilliseconds,
  )

  if (first.ok || !first.retryable || !canRetry) {
    return first
  }

  // Once: that takes the ~14% seen in #384 to about 2%, and a third attempt would
  // keep someone waiting on a request that is probably doomed.
  console.warn(`[gas] ${endpoint.endpoint} retrying after ${first.error}`)
  await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MILLISECONDS))

  const second = await attemptRequest<TSuccess>(
    endpoint,
    request,
    timeoutMilliseconds,
  )

  if (second.ok && process.env.SENTRY_DSN) {
    Sentry.captureMessage('[gas] retry rescued a request', {
      extra: {
        endpoint: endpoint.endpoint,
        error: first.error,
        status: first.status,
      },
      fingerprint: ['gas', 'retry-rescued', endpoint.endpoint],
      level: 'warning',
    })
  }

  return second
}
