import type { Handle } from 'remix/component'
import { clientEntry, on } from 'remix/component'

export type ShareButtonProps = {
  label: string
  /** The message the system's share sheet prefills, which stands alone without a preview. */
  text: string
}

/**
 * _Sdílet_ (`02b`): opens the system's share sheet with the message prefilled, so the
 * editors-in-chief pick whichever messenger they send to. Only where the browser has
 * `navigator.share` and the pointer is a finger: on a computer the sheet is missing or poor, and
 * _Kopírovat_ into WhatsApp Web is quicker.
 *
 * Nothing is drawn until the page runs in the browser, because the server cannot know.
 */
export const ShareButton = clientEntry(
  import.meta.url,
  function ShareButton(handle: Handle<ShareButtonProps>) {
    let isAvailable = false

    handle.queueTask(() => {
      isAvailable =
        typeof navigator.share === 'function' && window.matchMedia('(hover: none)').matches
      if (isAvailable) handle.update()
    })

    return () => {
      if (!isAvailable) return null
      let { label, text } = handle.props

      return (
        <button
          class="vdm-btn vdm-btn--outline vdm-btn--sm"
          mix={on('click', () => {
            /* A share sheet closed without sending rejects; there is nothing to say about it. */
            navigator.share({ text }).catch(() => undefined)
          })}
          type="button"
        >
          {label}
        </button>
      )
    }
  },
)
