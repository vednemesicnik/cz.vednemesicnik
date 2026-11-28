import type { Handle } from 'remix/component'
import { clientEntry, ref } from 'remix/component'

export type FolderCheckProps = {
  /**
   * _Zkontrolovat znovu_: where it posts, its label and `Kontroluje se…` while Drive is asked.
   * `null` in a closed issue, whose Callout has no action.
   */
  action: { href: string; label: string; pendingLabel: string } | null
  /**
   * The page's own check of every folder on record as missing, once it stands: where it posts, and
   * `load`, new on every load of the detail that asks. A client entry's `key` never reaches the
   * browser, and a load the runtime reconciles into this document only updates the island's
   * props, so `load` is how the island tells a new load from a render of the same one. `null` on
   * a load that asks nothing: a check's own reload, or a question over the detail.
   */
  arrivalCheck: { href: string; load: string } | null
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
 * One check per load however many Callouts start it, so a detail with three marked folders asks
 * Drive once and reloads once. The entry goes when the check settles rather than staying for the
 * document's life, because the runtime keeps the document across navigations.
 */
const runs = new Map<string, Promise<void>>()

function isChangedOf(body: unknown): boolean {
  if (typeof body !== 'object' || body === null) return false
  return (body as Record<string, unknown>).changed === true
}

/**
 * The reload comes only when the answer says a record changed: the reload asks nothing again, and
 * a load after it that does ask finds the same records and stops there, so a folder that stays
 * missing never reloads the page in a loop.
 */
function checkOnce(
  check: { href: string; load: string },
  csrfToken: string,
  reload: () => Promise<unknown>,
): Promise<void> {
  let run = runs.get(check.load)
  if (run !== undefined) return run
  let body = new FormData()
  body.set('_csrf', csrfToken)
  /* A check that failed reloads nothing: the records stand, and so do the Callouts. */
  run = fetch(check.href, { body, method: 'POST' })
    .then(async (response) => {
      if (response.ok && isChangedOf(await response.json())) await reload()
    })
    .catch(() => undefined)
    .finally(() => runs.delete(check.load))
  runs.set(check.load, run)
  return run
}

/**
 * The action row of a missing folder's Callout and the waitline along its top edge (`12j`). The
 * detail stands from the database first; then, on every load of the detail that asks, this asks
 * Drive about the folders on record as missing and, when a record changed, reloads the page, which
 * drops a Callout whose folder is back without a toast and keeps the one the detail opened with.
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

    let asked: string | null = null
    let arrive = (check: { href: string; load: string }, csrfToken: string) => {
      isChecking = true
      handle.update()
      wait()
      checkOnce(check, csrfToken, () => handle.frames.top.reload()).then(() => {
        /* A later load's check owns the waitline once it started. */
        if (handle.signal.aborted || asked !== check.load) return
        isChecking = false
        settle()
      })
    }

    return () => {
      let { action, arrivalCheck, csrfToken } = handle.props
      /* The check starts after the render, which matches the server's ordinary form and so
         hydrates without a mismatch; without the runtime, that form is all there is. */
      if (typeof document !== 'undefined' && arrivalCheck !== null && arrivalCheck.load !== asked) {
        asked = arrivalCheck.load
        /* A copy: the runtime updates `handle.props` in place for the next load. */
        let check = { ...arrivalCheck }
        handle.queueTask(() => arrive(check, csrfToken))
      }
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
