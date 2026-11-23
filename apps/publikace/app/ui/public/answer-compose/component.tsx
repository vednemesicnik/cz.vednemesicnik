import type { Handle } from 'remix/component'
import { clientEntry, on, ref } from 'remix/component'

/**
 * What the form says and does in each moment of `13d`/`13e`:
 *
 * - `write`: the field is editable, _Odeslat odpověď_ and _Zrušit_;
 * - `unconfirmed`: the Mailer did not confirm a send, the field is locked so a retry sends the
 *   same text, _Odeslat znovu_ and _Zavřít_;
 * - `closed`: nothing more can go from here (refused for good, or another answer went), the text
 *   stays to be copied, _Zavřít_ alone.
 */
export type AnswerComposeMode = 'closed' | 'unconfirmed' | 'write'

export type AnswerComposeProps = {
  /** Where the form posts: the answer, or the retry of the one on record. */
  action: string
  /** The card's anchor: the form opens from `reply-{anchor}-answer` and hides `reply-{anchor}-actions`. */
  anchor: string
  /** The stored answer a retry sends again. */
  answerId: number | null
  callout: { text: string; title: string; tone: 'error' | 'success' | 'warning' } | null
  /** _Zrušit_ or _Zavřít_ as a link to the queue without the form, for a page without script. */
  closeHref: string
  closeLabel: string
  csrfToken: string
  /** The sentence under the field when the text cannot go as it is (`13d`). */
  error: string | null
  /** The note under the field; empty where the text can only be copied (`13e`). */
  hint: string
  /** Open as the page is drawn: `?reply=`, or the answer coming back from a send. */
  isOpen: boolean
  label: string
  maxLength: number
  /** The reply the card showed, which the answer is to. */
  messageId: string
  mode: AnswerComposeMode
  /** The name under the text, `null` for the newsroom's signature alone. */
  signatureName: string | null
  newsroom: string
  pendingLabel: string
  submitLabel: string
  text: string
}

/*
 * The icons of `app/ui/callout`, drawn here again because this form runs in the browser and that
 * component is not served to it.
 */
function CalloutIcon(handle: Handle<{ tone: 'error' | 'success' | 'warning' }>) {
  return () => (
    <svg
      aria-hidden="true"
      class="vdm-callout__icon"
      fill="none"
      focusable="false"
      height="16"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      viewBox="0 0 24 24"
      width="16"
    >
      {handle.props.tone === 'warning' ? (
        <>
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </>
      ) : handle.props.tone === 'success' ? (
        <>
          <circle cx="12" cy="12" r="10" />
          <path d="m9 12 2 2 4-4" />
        </>
      ) : (
        <>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4" />
          <path d="M12 16h.01" />
        </>
      )}
    </svg>
  )
}

/* How long a send may take before the card shows that it is waiting (`13d`). */
const WAITLINE_DELAY_MS = 300

/**
 * The answer on a card of _Ke kontrole_ (`13d`, r1oqllvb): a form under the quote that stands in
 * for the card's actions while it is open, so the card has one main action. It opens in place from
 * _Odpovědět_, which stays a link to `?reply=` that opens it on a page without script, and each
 * card keeps its own text. _Zrušit_ throws the text away and gives focus back to _Odpovědět_.
 *
 * While it sends, both controls are locked and the submit turns, and after a moment the card
 * shows the system's one sign of waiting on its top edge; a second click sends nothing.
 *
 * The field takes `defaultValue`: a hydrated `value` is controlled and would undo typing.
 */
export const AnswerCompose = clientEntry(
  import.meta.url,
  function AnswerCompose(handle: Handle<AnswerComposeProps>) {
    let isOpen = handle.props.isOpen
    let isPending = false
    let isWaiting = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let field: HTMLTextAreaElement | null = null
    handle.signal.addEventListener('abort', () => clearTimeout(timer), { once: true })

    function others(): { actions: HTMLElement | null; opener: HTMLElement | null } {
      let { anchor } = handle.props
      return {
        actions: document.getElementById(`reply-${anchor}-actions`),
        opener: document.getElementById(`reply-${anchor}-answer`),
      }
    }

    function open(): void {
      isOpen = true
      handle.update()
      requestAnimationFrame(() => field?.focus())
    }

    function close(): void {
      isOpen = false
      if (field !== null && handle.props.mode === 'write') field.value = ''
      handle.update()
      requestAnimationFrame(() => others().opener?.focus())
    }

    handle.frame.addEventListener(
      'reloadComplete',
      () => {
        if (!isPending) return
        clearTimeout(timer)
        isPending = false
        isWaiting = false
        handle.update()
      },
      { signal: handle.signal },
    )

    /*
     * Whether the server drew the form open last time. A reload of the page keeps this island's
     * state and hands it new props, so a change of that answer wins over what was clicked here;
     * the same answer again leaves the form as the editor left it.
     */
    let drawnOpen = handle.props.isOpen

    /* The island alone shows or hides the card's actions, after every render, so the two never
       stand on the card at once whatever the server drew. */
    function syncActions(): void {
      let { actions } = others()
      if (actions !== null) actions.hidden = isOpen
    }

    return () => {
      let props = handle.props
      if (props.isOpen !== drawnOpen) {
        drawnOpen = props.isOpen
        isOpen = props.isOpen
      }
      handle.queueTask(syncActions)
      let fieldId = `reply-${props.anchor}-text`
      let hintId = `${fieldId}-hint`
      let errorId = `${fieldId}-error`
      let isLocked = props.mode !== 'write'

      /* `hidden` on a wrapper of its own: the design system's `display: flex` on the form would
         win over the attribute. */
      return (
        <div hidden={isOpen ? undefined : true}>
          <form
            action={props.action}
            class="vdm-queue-item__compose"
            method="post"
            mix={[
              ref((node, signal) => {
                let { opener } = others()
                opener?.addEventListener(
                  'click',
                  (event) => {
                    event.preventDefault()
                    open()
                  },
                  { signal },
                )
                if (isOpen) requestAnimationFrame(() => field?.focus())
                ;(node as HTMLFormElement).addEventListener(
                  'submit',
                  () => {
                    isPending = true
                    handle.update()
                    timer = setTimeout(() => {
                      isWaiting = true
                      handle.update()
                    }, WAITLINE_DELAY_MS)
                  },
                  { signal },
                )
              }),
            ]}
          >
            {isWaiting ? (
              <span
                aria-hidden="true"
                class="vdm-waitline"
                style={{ left: 0, position: 'absolute', right: 0, top: 0 }}
              ></span>
            ) : null}
            <input name="_csrf" type="hidden" value={props.csrfToken} />
            <input name="reply" type="hidden" value={props.messageId} />
            {props.answerId === null ? null : (
              <input name="answer" type="hidden" value={String(props.answerId)} />
            )}
            <div class="vdm-field">
              <label class="vdm-field__label" for={fieldId}>
                {props.label}
              </label>
              <textarea
                aria-describedby={
                  [props.error === null ? null : errorId, props.hint === '' ? null : hintId]
                    .filter((id) => id !== null)
                    .join(' ') || undefined
                }
                aria-invalid={props.error === null ? undefined : 'true'}
                class={
                  isLocked
                    ? 'vdm-field__input vdm-field__textarea vdm-field__input--locked'
                    : 'vdm-field__input vdm-field__textarea'
                }
                defaultValue={props.text}
                id={fieldId}
                maxLength={props.maxLength}
                mix={ref((node) => {
                  field = node as HTMLTextAreaElement
                })}
                name="text"
                readOnly={isLocked}
                rows={6}
              ></textarea>
              {props.error === null ? null : (
                <span class="vdm-field__hint vdm-field__hint--error" id={errorId}>
                  {props.error}
                </span>
              )}
              {props.hint === '' ? null : (
                <span class="vdm-field__hint" id={hintId}>
                  {props.hint}
                </span>
              )}
              {isLocked ? null : (
                <span class="vdm-field__hint">
                  {props.signatureName === null ? null : (
                    <>
                      {props.signatureName}
                      <br />
                    </>
                  )}
                  {props.newsroom}
                </span>
              )}
            </div>
            {props.callout === null ? null : (
              <div
                class={`vdm-callout vdm-callout--${props.callout.tone} vdm-callout--icon`}
                role={props.callout.tone === 'success' ? 'status' : 'alert'}
              >
                <CalloutIcon tone={props.callout.tone} />
                <div class="vdm-callout__body">
                  <p class="vdm-callout__title">{props.callout.title}</p>
                  {/* Inline, as the other Callouts write it: `css()` would lose to the design
                    system's own rules for a paragraph in the body. */}
                  <p style={{ margin: 0 }}>{props.callout.text}</p>
                </div>
              </div>
            )}
            <div class="vdm-queue-item__actions">
              {props.mode === 'closed' ? null : (
                <button
                  class="vdm-btn vdm-btn--primary vdm-btn--sm"
                  disabled={isPending}
                  type="submit"
                >
                  {isPending ? (
                    <>
                      <span aria-hidden="true" class="vdm-spinner"></span>
                      {props.pendingLabel}
                    </>
                  ) : (
                    props.submitLabel
                  )}
                </button>
              )}
              {isPending ? (
                <button class="vdm-btn vdm-btn--ghost vdm-btn--sm" disabled type="button">
                  {props.closeLabel}
                </button>
              ) : (
                <a
                  class="vdm-btn vdm-btn--ghost vdm-btn--sm"
                  href={props.closeHref}
                  mix={on('click', (event) => {
                    event.preventDefault()
                    close()
                  })}
                >
                  {props.closeLabel}
                </a>
              )}
            </div>
          </form>
        </div>
      )
    }
  },
)
