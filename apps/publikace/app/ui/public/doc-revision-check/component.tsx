import type { Handle } from 'remix/component'
import { clientEntry } from 'remix/component'

import { checkInTurn } from '../detail-checks.ts'

export type DocRevisionCheckProps = {
  /** Where the detail's own check posts once the page stands. */
  href: string
  csrfToken: string
  /**
   * New on every load of the detail that asks. A client entry's `key` never reaches the browser,
   * and a load the runtime reconciles into this document only updates the island's props, so this
   * is how the island tells a new load from a render of the same one.
   */
  load: string
}

/** A trigger of `⋯` whose menu is open, as `ActionMenu` marks it. */
const OPEN_MENU = '[aria-expanded="true"]'

/** The articles whose rows the answer changes, by the IDs it lists. */
function changedOf(body: unknown): string[] {
  if (typeof body !== 'object' || body === null) return []
  let { changed } = body as Record<string, unknown>
  return Array.isArray(changed) ? changed.filter((id) => typeof id === 'string' && id !== '') : []
}

/**
 * Resolves once no changed row has its `⋯` open, so a menu never changes under the hand
 * (`12q`). The rows' triggers say it in `aria-expanded`, which this watches until it clears, or
 * until the island goes, when it resolves too and the island, no longer current, reloads nothing.
 */
function untilMenusClose(ids: readonly string[], signal: AbortSignal): Promise<void> {
  let rows = ids.map((id) => document.getElementById(`article-${id}`)).filter((row) => row !== null)
  let isAnyOpen = () => rows.some((row) => row.querySelector(OPEN_MENU) !== null)
  if (!isAnyOpen()) return Promise.resolve()
  return new Promise((resolve) => {
    let observer = new MutationObserver(() => {
      if (isAnyOpen()) return
      observer.disconnect()
      resolve()
    })
    for (let row of rows) {
      observer.observe(row, { attributeFilter: ['aria-expanded'], attributes: true, subtree: true })
    }
    signal.addEventListener(
      'abort',
      () => {
        observer.disconnect()
        resolve()
      },
      { once: true },
    )
  })
}

/** The rows the answer changes; none when Drive did not answer or found nothing new. */
async function ask(props: DocRevisionCheckProps, signal: AbortSignal): Promise<string[]> {
  let body = new FormData()
  body.set('_csrf', props.csrfToken)
  body.set('load', props.load)
  let response = await fetch(props.href, { body, method: 'POST', signal })
  return response.ok ? changedOf(await response.json()) : []
}

/**
 * The detail's own question to Drive whether an approved text was edited after its PDF (`12q`),
 * asked once on every load of the detail that asks, after it stands. The page stands from the
 * database first and shows nothing while Drive is asked; when the answer lists a changed row,
 * this reloads the page, which reconciles into the live one, so focus, an open row, the table's
 * sideways scroll and the toast the detail opened with stay. That load holds a row just found
 * _Upraveno po schválení_ where it stood, tinted, and fills the page's status line, which a
 * screen reader reads on its own. A Drive that does not answer, or an answer with nothing new,
 * changes nothing. It draws nothing itself.
 *
 * A full reload rather than a frame per row: `.vdm-table` takes its rows and bands as direct
 * children, which a frame's wrapper would break, and the reload already keeps what a frame was
 * there to keep.
 *
 * Without the browser runtime nothing is asked: the rows stand as recorded.
 */
export const DocRevisionCheck = clientEntry(
  import.meta.url,
  function DocRevisionCheck(handle: Handle<DocRevisionCheckProps>) {
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
        /* A copy: the runtime updates `handle.props` in place for the next load. */
        let props = { ...handle.props }
        let changed: string[] = []
        let check = async () => {
          changed = await ask(props, controller.signal)
          return changed.length > 0
        }
        handle.queueTask(() => {
          void checkInTurn(props.load, 'doc-revisions', check, {
            beforeReload: () => untilMenusClose(changed, controller.signal),
            isCurrent: () => !controller.signal.aborted,
            reload: () => handle.frames.top.reload(),
          })
        })
      }
      return null
    }
  },
)
