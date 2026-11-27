import { createHmac } from 'node:crypto'

/**
 * How the app signs a call to an Apps Script web app, the Mailer or a job's `doPost`: `payload`
 * is the request serialised once and signed as that exact string, `signature` is HMAC-SHA256 of
 * `${timestamp}.${payload}` under the secret, which itself never leaves the app. The script reads
 * it with `Toolkit.readSignedRequest` and refuses a request older than five minutes.
 */
export function signEnvelope(
  secret: string,
  payload: string,
  timestamp: number,
): { payload: string; signature: string; timestamp: number } {
  let signature = createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex')
  return { payload, signature, timestamp }
}
