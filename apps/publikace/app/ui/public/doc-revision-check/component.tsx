import type { Handle } from 'remix/component'
import { clientEntry } from 'remix/component'

export type DocRevisionCheckProps = {
  /** Where the detail's own check posts once the page stands. */
  href: string
  csrfToken: string
}

/** A trigger of `⋯` whose menu is open, as `ActionMenu` marks it. */
const OPEN_MENU = '[aria-expanded="true"]'

/** The articles whose rows the answer changes, by the IDs it lists. */
function changedOf(body: unknown): number[] {
  if (typeof body !== 'object' || body === null) return []
  let { changed } = body as Record<string, unknown>
  return Array.isArray(changed) ? changed.filter((id) => Number.isSafeInteger(id)) : []
}

/**
 * Resolves once no changed row has its `⋯` open, so a menu never changes under the hand
 * (`12q`). The rows' triggers say it in `aria-expanded`, which this watches until it clears, or
 * until the island goes.
 */
function untilMenusClose(ids: readonly number[], signal: AbortSignal): Promise<void> {
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
    signal.addEventListener('abort', () => observer.disconnect(), { once: true })
  })
}

/**
 * The detail's own question to Drive whether an approved text was edited after its PDF (`12q`).
 * The page stands from the database first and shows nothing while Drive is asked; when the
 * answer lists a changed row, this reloads the page, which reconciles into the live one, so
 * focus, an open row and the table's sideways scroll stay. That load holds a row just found
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
    /* The check starts after the first render, which matches the server's markup and so
       hydrates without a mismatch. The page gives this a new key on every load of the detail,
       so a load the runtime reconciles mounts a new one that asks again. */
    if (typeof document !== 'undefined') {
      handle.queueTask(async () => {
        let { csrfToken, href } = handle.props
        let body = new FormData()
        body.set('_csrf', csrfToken)
        try {
          let response = await fetch(href, {
            body,
            method: 'POST',
            signal: handle.signal,
          })
          if (!response.ok) return
          let changed = changedOf(await response.json())
          if (changed.length === 0 || handle.signal.aborted) return
          await untilMenusClose(changed, handle.signal)
          if (handle.signal.aborted) return
          await handle.frames.top.reload()
        } catch {
          /* A check that failed reloads nothing: the rows stand as recorded. */
        }
      })
    }

    return () => null
  },
)
