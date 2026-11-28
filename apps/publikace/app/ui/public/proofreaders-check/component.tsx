import type { Handle } from 'remix/component'
import { clientEntry } from 'remix/component'

export type ProofreadersCheckProps = {
  /** Where Nastavení's own check posts once the page stands. */
  href: string
  csrfToken: string
}

function isUnknownGroupOf(body: unknown): boolean {
  if (typeof body !== 'object' || body === null) return false
  return (body as Record<string, unknown>).isUnknownGroup === true
}

/**
 * Nastavení's own question to the membership service whether it knows the proofreaders' address
 * (`14f`). The page stands from the database first and shows nothing while the service is asked:
 * the answer only decides whether a rare warning appears. When the service does not know the
 * address, this reloads the page, which reconciles into the live one and draws the warning under
 * the address. A service that does not answer, or one that knows it, changes nothing. It draws
 * nothing itself.
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
        let { csrfToken, href } = handle.props
        let body = new FormData()
        body.set('_csrf', csrfToken)
        try {
          let response = await fetch(href, { body, method: 'POST', signal: handle.signal })
          if (!response.ok) return
          if (!isUnknownGroupOf(await response.json()) || handle.signal.aborted) return
          await handle.frames.top.reload()
        } catch {
          /* A check that failed reloads nothing: the page shows no warning. */
        }
      })
    }

    return () => null
  },
)
