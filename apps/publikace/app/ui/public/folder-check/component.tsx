import type { Handle } from 'remix/component'
import { clientEntry, ref } from 'remix/component'

export type FolderCheckProps = {
  /**
   * _Zkontrolovat znovu_: where it posts, its label and `Kontroluje se…` while Drive is asked.
   * `null` in a closed issue, whose Callout has no action.
   */
  action: { href: string; label: string; pendingLabel: string } | null
  /** Where the page's own check of every folder on record as missing posts once it stands. */
  arrivalCheck: string
  csrfToken: string
}

/** `12j`: the waitline shows only for a check that takes longer than this. */
const WAITLINE_DELAY_MS = 300

/**
 * The Callout's padding box: inside its 1px border and rounded as the border's inner edge, so the
 * bar runs just under the border and never covers it.
 */
const WAITLINE_CLIP = {
  borderRadius: 'calc(var(--radius-lg) - 1px)',
  inset: '1px',
  overflow: 'hidden',
  pointerEvents: 'none',
  position: 'absolute',
} as const

/**
 * One check per page however many Callouts start it, so a detail with three marked folders asks
 * Drive once and reloads once. The entry goes when the check settles rather than staying for the
 * document's life, because the runtime keeps the document across navigations, and the detail
 * opened again later has to ask again.
 */
const runs = new Map<string, Promise<void>>()

function checkOnce(href: string, csrfToken: string, reload: () => Promise<unknown>): Promise<void> {
  let run = runs.get(href)
  if (run !== undefined) return run
  let body = new FormData()
  body.set('_csrf', csrfToken)
  /* A check that failed reloads nothing: the records stand, and so do the Callouts. */
  run = fetch(href, { body, method: 'POST' })
    .then(async (response) => {
      if (response.ok) await reload()
    })
    .catch(() => undefined)
    .finally(() => runs.delete(href))
  runs.set(href, run)
  return run
}

/**
 * The action row of a missing folder's Callout and the waitline along its top edge (`12j`). The
 * detail stands from the database first; then this asks Drive about the folders on record as
 * missing and reloads the page, which drops a Callout whose folder is back without a toast.
 * _Zkontrolovat znovu_ waits the same way, and its answer comes as the page it redirects to.
 *
 * The waitline is a bar along the top edge, inside the Callout's border, and not the class on a
 * wrapper as the drawing writes it: the design system's `.vdm-waitline` is a 3px block that
 * clips what it holds. The page's wrapper gives the Callout a containing block.
 *
 * Without the browser runtime nothing asks on arrival: the marks show as recorded, and
 * _Zkontrolovat znovu_ is an ordinary form.
 */
export const FolderCheck = clientEntry(
  import.meta.url,
  function FolderCheck(handle: Handle<FolderCheckProps>) {
    let isChecking = false
    let isSubmitted = false
    let isWaiting = false
    let timer: ReturnType<typeof setTimeout> | undefined

    let wait = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        isWaiting = true
        handle.update()
      }, WAITLINE_DELAY_MS)
    }
    let settle = () => {
      if (isChecking || isSubmitted) return
      clearTimeout(timer)
      isWaiting = false
      handle.update()
    }

    handle.signal.addEventListener('abort', () => clearTimeout(timer))
    /* Only a submit ends at `reloadComplete`: the navigation that mounted this island completes
       after it, while the check it started is still on its way. */
    handle.frame.addEventListener(
      'reloadComplete',
      () => {
        if (!isSubmitted) return
        isSubmitted = false
        settle()
      },
      { signal: handle.signal },
    )

    /* The check starts after the first render, which matches the server's ordinary form and so
       hydrates without a mismatch; without the runtime, that form is all there is. */
    if (typeof document !== 'undefined') {
      handle.queueTask(() => {
        isChecking = true
        handle.update()
        wait()
        let { arrivalCheck, csrfToken } = handle.props
        checkOnce(arrivalCheck, csrfToken, () => handle.frames.top.reload()).then(() => {
          if (handle.signal.aborted) return
          isChecking = false
          settle()
        })
      })
    }

    return () => {
      let { action, csrfToken } = handle.props
      let isPending = isChecking || isSubmitted

      return (
        <>
          {isWaiting ? (
            <span aria-hidden="true" style={WAITLINE_CLIP}>
              <span
                class="vdm-waitline"
                style={{ left: 0, position: 'absolute', right: 0, top: 0 }}
              ></span>
            </span>
          ) : null}
          {action === null ? null : (
            <form
              action={action.href}
              class="vdm-callout__actions"
              method="post"
              mix={ref((node, signal) => {
                node.addEventListener(
                  'submit',
                  () => {
                    isSubmitted = true
                    handle.update()
                    wait()
                  },
                  { signal },
                )
              })}
            >
              <input name="_csrf" type="hidden" value={csrfToken} />
              <button
                class="vdm-btn vdm-btn--outline vdm-btn--sm"
                disabled={isPending}
                type="submit"
              >
                {isPending ? (
                  <>
                    <span aria-hidden="true" class="vdm-spinner"></span>
                    {action.pendingLabel}
                  </>
                ) : (
                  action.label
                )}
              </button>
            </form>
          )}
        </>
      )
    }
  },
)
