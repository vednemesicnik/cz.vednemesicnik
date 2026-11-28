import type { Handle } from 'remix/component'
import { clientEntry } from 'remix/component'

export type ProofreadersCheckProps = {
  /** Where Nastavení's own check posts once the page stands. */
  href: string
  csrfToken: string
  /** The warning the page drew hidden under the address, which the answer shows. */
  warningId: string
}

function isUnknownGroupOf(body: unknown): boolean {
  if (typeof body !== 'object' || body === null) return false
  return (body as Record<string, unknown>).isUnknownGroup === true
}

/**
 * Nastavení's own question to the membership service whether it knows the proofreaders' address
 * (`14f`). The page stands from the database first and shows nothing while the service is asked:
 * the answer only decides whether a rare warning appears. The warning is already on the page,
 * hidden, and this states what the answer said in its `hidden`, so nothing reloads and a toast or
 * a Callout the page opened with stays. A service that does not answer shows nothing.
 *
 * The answer is written both ways, because the runtime reconciles a later load of Nastavení into
 * this document, and a warning shown on an earlier load would otherwise stay.
 *
 * Without the browser runtime nothing is asked, and no warning shows.
 */
export const ProofreadersCheck = clientEntry(
  import.meta.url,
  function ProofreadersCheck(handle: Handle<ProofreadersCheckProps>) {
    /* The check starts after the first render, which matches the server's markup and so
       hydrates without a mismatch. The page gives this a new key on every load, so a load the
       runtime reconciles mounts a new one that asks again. */
    if (typeof document !== 'undefined') {
      handle.queueTask(async () => {
        let { csrfToken, href, warningId } = handle.props
        let body = new FormData()
        body.set('_csrf', csrfToken)
        let isUnknownGroup = false
        try {
          let response = await fetch(href, { body, method: 'POST', signal: handle.signal })
          isUnknownGroup = response.ok && isUnknownGroupOf(await response.json())
        } catch {
          /* A check that failed says nothing about the address. */
        }
        if (handle.signal.aborted) return
        let warning = document.getElementById(warningId)
        if (warning !== null) warning.hidden = !isUnknownGroup
      })
    }

    return () => null
  },
)
