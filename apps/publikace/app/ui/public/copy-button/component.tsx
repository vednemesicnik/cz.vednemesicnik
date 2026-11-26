import type { Handle } from 'remix/component'
import { clientEntry, on, ref } from 'remix/component'
import { tied } from '../../../domain/public/typography.ts'

export type CopyButtonProps = {
  /** Focused on arrival: the link of a fresh issue or a renewed one (`12c`, `02d`). */
  isFocused?: boolean
  /** The value as the page shows it, which may be shorter than what is copied. */
  shown: string
  value: string
}

const LABEL = 'Kopírovat'
const COPIED_LABEL = 'Zkopírováno'
const COPIED_MS = 2000

/* When the clipboard refuses, by pointer, as the design system words it for the administration
   (u7ok7g8f, uvjknd7d, zs8dklyw). */
const FAILED_FINE =
  'Zkopírujte označený text pomocí Ctrl+C, na Macu ⌘C — kopírování tlačítkem se nepodařilo.'
const FAILED_TOUCH = tied`Označte celý text a zkopírujte ho — kopírování tlačítkem se nepodařilo.`

function CopyIcon(handle: Handle<{ isOff: boolean }>) {
  return () => (
    <svg
      aria-hidden="true"
      class={handle.props.isOff ? 'vdm-copybutton__off' : undefined}
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      viewBox="0 0 24 24"
    >
      <rect height="14" rx="2" ry="2" width="14" x="8" y="8" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  )
}

function CheckIcon(handle: Handle<{ isOff: boolean }>) {
  return () => (
    <svg
      aria-hidden="true"
      class={handle.props.isOff ? 'vdm-copybutton__off' : undefined}
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      viewBox="0 0 24 24"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

/**
 * The design system's `CopyButton` with its value (4c4ynjih): the value as plain text and an
 * outline button beside it, in a row that wraps. After a copy a check and _Zkopírováno_ for 2 s,
 * both states in one cell each, so the width never changes. When the clipboard refuses, the value
 * is selected and a sentence under the row says how to copy it by hand.
 *
 * Writes the design system's markup and leaves the look to `components.css`.
 */
export const CopyButton = clientEntry(
  import.meta.url,
  function CopyButton(handle: Handle<CopyButtonProps>) {
    let status: 'copied' | 'fine' | 'idle' | 'touch' = 'idle'
    let timer: ReturnType<typeof setTimeout> | undefined
    let button: HTMLButtonElement | null = null
    let valueNode: HTMLElement | null = null
    handle.signal.addEventListener('abort', () => clearTimeout(timer), { once: true })

    function selectValue(): void {
      let selection = window.getSelection()
      if (valueNode === null || selection === null) return
      button?.focus({ preventScroll: true })
      let range = document.createRange()
      range.selectNodeContents(valueNode)
      selection.removeAllRanges()
      selection.addRange(range)
    }

    async function copy(): Promise<void> {
      clearTimeout(timer)
      status = 'idle'
      try {
        await navigator.clipboard.writeText(handle.props.value)
      } catch {
        selectValue()
        status = window.matchMedia('(any-pointer: fine)').matches ? 'fine' : 'touch'
        handle.update()
        document.addEventListener(
          'copy',
          () => {
            status = 'idle'
            handle.update()
          },
          { once: true, signal: handle.signal },
        )
        return
      }
      status = 'copied'
      handle.update()
      timer = setTimeout(() => {
        status = 'idle'
        handle.update()
      }, COPIED_MS)
    }

    return () => {
      let { isFocused = false, shown, value } = handle.props
      let isCopied = status === 'copied'
      let isFailed = status === 'fine' || status === 'touch'

      return (
        <>
          <span class="vdm-copybutton">
            <span
              class="vdm-copybutton__value"
              mix={ref((node) => {
                valueNode = node as HTMLElement
              })}
            >
              {shown}
            </span>
            <button
              autofocus={isFocused ? true : undefined}
              class="vdm-btn vdm-btn--outline vdm-btn--sm vdm-copybutton__button"
              mix={[
                on('click', () => void copy()),
                ref((node) => {
                  button = node as HTMLButtonElement
                  if (isFocused) button.focus()
                }),
              ]}
              type="button"
            >
              <span class="vdm-sr-only">{`${LABEL} ${value}`}</span>
              <span aria-hidden="true" class="vdm-copybutton__content">
                <span class="vdm-copybutton__cell">
                  <CopyIcon isOff={isCopied} />
                  <CheckIcon isOff={!isCopied} />
                </span>
                <span class="vdm-copybutton__cell">
                  <span class={isCopied ? 'vdm-copybutton__off' : undefined}>{LABEL}</span>
                  <span class={isCopied ? undefined : 'vdm-copybutton__off'}>{COPIED_LABEL}</span>
                </span>
              </span>
            </button>
          </span>
          <span class={isFailed ? 'vdm-copybutton__failed' : 'vdm-sr-only'} role="status">
            {isCopied
              ? COPIED_LABEL
              : status === 'fine'
                ? FAILED_FINE
                : isFailed
                  ? FAILED_TOUCH
                  : ''}
          </span>
        </>
      )
    }
  },
)
