/**
 * Signs a request to a Google Apps Script web app instead of putting the shared
 * secret inside it.
 *
 * The argument is not replay. It is that a secret in the request body travels on
 * every single call, so a proxy, an error tracker or the platform's own logs have
 * captured a working credential. A signature covers *this* message and the secret
 * never leaves either end.
 *
 * Verified on the far side by `Toolkit.verifySignature` (the SCRIPT__Toolkit
 * library). Not every Apps Script endpoint reads this shape yet — `editorial-board`
 * still compares a bare secret — so signing is applied at the call sites that have
 * moved rather than inside the shared `postGasRequest`.
 */

import { createHmac } from 'node:crypto'

export type SignedGasEnvelope = {
  /** The request, serialised once. Signed as exactly these bytes. */
  payload: string
  /** Lower-case hex HMAC-SHA256 over `${timestamp}.${payload}`. */
  signature: string
  /** Unix seconds. Inside the signature, so it cannot be adjusted. */
  timestamp: number
}

/**
 * Wraps `request` in a signed envelope the Apps Script side can verify.
 *
 * The payload is serialised **once** and signed as that exact string. It is
 * deliberately not an object the far end re-serialises: JSON key order would then
 * have to agree between Node and Apps Script for a signature to verify, and nothing
 * guarantees that it does.
 *
 * The timestamp is stamped fresh on every call, so a retry is a different envelope.
 * Freshness bounds how long a captured request stays usable; it does not make a
 * retry safe, which is what an idempotency key inside the payload is for.
 *
 * @param secret The endpoint's `OWN_SECRET`, used here as a signing key rather than
 *   as a bearer token. It does not appear in the returned envelope.
 * @param request The request body the endpoint expects, without any secret field.
 * @returns The envelope to POST.
 */
export const signGasRequest = (
  secret: string,
  request: unknown,
): SignedGasEnvelope => {
  const payload = JSON.stringify(request)
  const timestamp = Math.floor(Date.now() / 1000)

  return {
    payload,
    signature: createHmac('sha256', secret)
      .update(`${timestamp}.${payload}`)
      .digest('hex'),
    timestamp,
  }
}
