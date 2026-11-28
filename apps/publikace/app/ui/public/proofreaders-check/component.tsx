import type { Handle } from 'remix/component'
import { clientEntry } from 'remix/component'

export type ProofreadersCheckProps = {
  /** Where Nastavení's own check posts once the page stands. */
  href: string
  csrfToken: string
  /**
   * New on every load of Nastavení. A client entry's `key` never reaches the browser, and a load
   * the runtime reconciles into this document only updates the island's props, so this is how
   * the island tells a new load from a render of the same one.
   */
  load: string
  /** The warning the page drew hidden under the address, which the answer shows. */
  warningId: string
}

function isUnknownGroupOf(body: unknown): boolean {
  if (typeof body !== 'object' || body === null) return false
  return (body as Record<string, unknown>).isUnknownGroup === true
}

async function ask(props: ProofreadersCheckProps, signal: AbortSignal): Promise<void> {
  let body = new FormData()
  body.set('_csrf', props.csrfToken)
  let isUnknownGroup = false
  try {
    let response = await fetch(props.href, { body, method: 'POST', signal })
    isUnknownGroup = response.ok && isUnknownGroupOf(await response.json())
  } catch {
    /* A check that failed says nothing about the address. */
  }
  if (signal.aborted) return
  let warning = document.getElementById(props.warningId)
  if (warning !== null) warning.hidden = !isUnknownGroup
}

/**
 * Nastavení's own question to the membership service whether it knows the proofreaders' address
 * (`14f`), asked once on every load of the page, after it stands. The answer only decides whether
 * a rare warning shows: the page drew it hidden under the address, and this writes the answer
 * into its `hidden`, so nothing reloads and a toast or a Callout the page opened with stays. A
 * service that does not answer shows nothing.
 *
 * A load reconciled into this document keeps the warning as the last answer left it (the page
 * marks its `hidden` as the live one's), until this load's answer writes it again either way.
 *
 * Without the browser runtime nothing is asked, and no warning shows.
 */
export const ProofreadersCheck = clientEntry(
  import.meta.url,
  function ProofreadersCheck(handle: Handle<ProofreadersCheckProps>) {
    let asked: string | null = null
    let pending: AbortController | null = null
    handle.signal.addEventListener('abort', () => pending?.abort())

    return () => {
      /* Asked after the render, which matches the server's markup and so hydrates without a
         mismatch; a check still on its way for an earlier load is dropped. */
      if (typeof document !== 'undefined' && handle.props.load !== asked) {
        asked = handle.props.load
        pending?.abort()
        let controller = new AbortController()
        pending = controller
        let props = handle.props
        handle.queueTask(() => {
          void ask(props, controller.signal)
        })
      }
      return null
    }
  },
)
