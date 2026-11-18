import type { Handle } from 'remix/component'
import { clientEntry, ref } from 'remix/component'

export type SelectedFieldProps = {
  /** Why the value was refused; it takes the hint's place under the field. */
  error?: string
  hint: string
  label: string
  /** The form field's name, which the label, the hint and the error are paired by. */
  name: string
  value: string
}

/**
 * A text field that arrives focused with its value selected, so replacing a suggested name is
 * one keystroke (`11d`). `autofocus` alone focuses and leaves the caret at the end.
 *
 * A refused value comes back into the same input rather than a new one, so the focus is given
 * back whenever a new error arrives: the submit that sent it was disabled while it went, and
 * focus fell off it.
 */
export const SelectedField = clientEntry(
  import.meta.url,
  function SelectedField(handle: Handle<SelectedFieldProps>) {
    let input: HTMLInputElement | null = null
    let shownError = handle.props.error

    function focusAndSelect(): void {
      input?.focus()
      input?.select()
    }

    return () => {
      let { error, hint, label, name, value } = handle.props
      if (error !== undefined && error !== shownError) handle.queueTask(focusAndSelect)
      shownError = error

      let id = `field-${name}`
      let messageId = error === undefined ? `${id}-hint` : `${id}-error`

      return (
        <div class="vdm-field">
          <label class="vdm-field__label" for={id}>
            {label}
          </label>
          <input
            aria-describedby={messageId}
            aria-invalid={error === undefined ? undefined : 'true'}
            autocomplete="off"
            autofocus
            class={
              error === undefined ? 'vdm-field__input' : 'vdm-field__input vdm-field__input--error'
            }
            // `defaultValue`: a hydrated input given `value` is controlled, and typing into it
            // would be undone on every keystroke.
            defaultValue={value}
            id={id}
            mix={ref((node) => {
              input = node as HTMLInputElement
              focusAndSelect()
            })}
            name={name}
            type="text"
          />
          {error === undefined ? (
            <span class="vdm-field__hint" id={messageId}>
              {hint}
            </span>
          ) : (
            <span class="vdm-field__hint vdm-field__hint--error" id={messageId}>
              {error}
            </span>
          )}
        </div>
      )
    }
  },
)
