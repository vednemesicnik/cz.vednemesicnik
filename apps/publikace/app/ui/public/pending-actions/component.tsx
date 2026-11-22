import type { Handle } from 'remix/component'
import { clientEntry, ref } from 'remix/component'

export type PendingActionsProps = {
  /**
   * The submit's name when its label alone does not say what it acts on, as in a row: it starts
   * with the visible label (_Předat ke korektuře článek ‹název›_, `12k`).
   */
  accessibleLabel?: string
  /**
   * The way back, as a link. Left out where the action has none (_Dokončit vydání_ in a row).
   * `hasFocus` where focus starts on it, so Enter on arrival never sends anything, in a dialog
   * whose step reaches people outside the newsroom (`15f`, `12r`), as _Zahodit dávku_ has it.
   */
  cancel?: { hasFocus?: boolean; href: string; label: string }
  /** `primary` in the dialog, `outline` beside a Callout or in a row. */
  emphasis: 'outline' | 'primary'
  label: string
  /** `Vydání se vytváří…`: what the button says while its form is on its way (`11d`, `12i`). */
  pendingLabel: string
}

/**
 * The action row of a form whose answer takes seconds: _Vytvořit vydání_ and _Dokončit vydání_.
 * While its own form is on its way, both controls are locked and the submit shows the spinner,
 * so a second click cannot start the same thing twice.
 *
 * Pending starts at this form's `submit` and not at the frame's `reloadStart`, because a page
 * can hold several of these (one per unfinished row) and only the one sent should turn. It ends
 * at `reloadComplete`, which also comes after an answer that re-renders the same form in place.
 * Without the browser runtime the form is an ordinary form and the browser shows the wait.
 */
export const PendingActions = clientEntry(
  import.meta.url,
  function PendingActions(handle: Handle<PendingActionsProps>) {
    let isPending = false

    handle.frame.addEventListener(
      'reloadComplete',
      () => {
        if (!isPending) return
        isPending = false
        handle.update()
      },
      { signal: handle.signal },
    )

    return () => {
      let { accessibleLabel, cancel, emphasis, label, pendingLabel } = handle.props

      return (
        <>
          {cancel === undefined ? null : isPending ? (
            <button class="vdm-btn vdm-btn--ghost vdm-btn--sm" disabled type="button">
              {cancel.label}
            </button>
          ) : (
            <a
              autofocus={cancel.hasFocus === true}
              class="vdm-btn vdm-btn--ghost vdm-btn--sm"
              href={cancel.href}
            >
              {cancel.label}
            </a>
          )}
          <button
            aria-label={isPending ? undefined : accessibleLabel}
            class={`vdm-btn vdm-btn--${emphasis} vdm-btn--sm`}
            disabled={isPending}
            mix={ref((node, signal) => {
              ;(node as HTMLButtonElement).form?.addEventListener(
                'submit',
                () => {
                  isPending = true
                  handle.update()
                },
                { signal },
              )
            })}
            type="submit"
          >
            {isPending ? (
              <>
                <span aria-hidden="true" class="vdm-spinner"></span>
                {pendingLabel}
              </>
            ) : (
              label
            )}
          </button>
        </>
      )
    }
  },
)
