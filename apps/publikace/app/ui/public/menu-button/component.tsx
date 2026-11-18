import type { Handle } from 'remix/component'
import { clientEntry, on } from 'remix/component'

export type MenuButtonProps = {
  /** The `id` of the `<dialog>` that holds the panel as a menu. */
  controls: string
}

/**
 * _Menu_ in the top bar on a phone (`11e`): opens the panel over the whole screen as a modal
 * `<dialog>`, which takes the page out of reach, closes on Escape and gives focus back here.
 * The dialog closes itself from its own _Zavřít_ (`<form method="dialog">`), so only opening
 * needs this. An invoker button (`command="show-modal"`) would need no script at all, but the
 * floor of `.browserslistrc` does not have it.
 */
export const MenuButton = clientEntry(
  import.meta.url,
  function MenuButton(handle: Handle<MenuButtonProps>) {
    let isOpen = false

    /* The next page is drawn into the same document, and an open `<dialog>` keeps its `open`
       through that, so a menu left open would cover the page it led to. */
    handle.frame.addEventListener(
      'reloadStart',
      () => {
        let dialog = document.getElementById(handle.props.controls)
        if (dialog instanceof HTMLDialogElement && dialog.open) dialog.close()
      },
      { signal: handle.signal },
    )

    return () => (
      <button
        aria-controls={handle.props.controls}
        aria-expanded={isOpen ? 'true' : 'false'}
        aria-haspopup="dialog"
        class="vdm-btn vdm-btn--ghost vdm-btn--sm vdm-topbar__menu"
        mix={on('click', () => {
          let dialog = document.getElementById(handle.props.controls)
          if (!(dialog instanceof HTMLDialogElement)) return
          dialog.addEventListener(
            'close',
            () => {
              isOpen = false
              handle.update()
            },
            { once: true, signal: handle.signal },
          )
          dialog.showModal()
          isOpen = true
          handle.update()
        })}
        type="button"
      >
        Menu
      </button>
    )
  },
)
