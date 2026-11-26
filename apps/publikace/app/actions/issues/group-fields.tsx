import type { Handle } from 'remix/component'

import {
  GROUP_NAME_LABEL,
  GROUP_NAME_PLACEHOLDER,
  GROUP_NOTE_HINT,
  GROUP_NOTE_LABEL,
  GROUP_NOTE_PLACEHOLDER,
  OPTIONAL_MARK,
} from '../../domain/artwork-group.ts'

export type GroupFieldsProps = {
  errors: { name: string | null; note: string | null }
  values: { name: string; note: string }
}

/**
 * _Název skupiny_ and _Poznámka pro grafika_ with their messages, the same in _Nová skupina_
 * (`12e`) and _Upravit skupinu_ (`12f`). Focus goes to the first field with a message, else to the
 * name.
 */
export function GroupFields(handle: Handle<GroupFieldsProps>) {
  return () => {
    let { errors, values } = handle.props
    let nameError = errors.name === null ? undefined : 'group-name-error'
    let noteMessage = errors.note === null ? 'group-note-hint' : 'group-note-error'
    return (
      <>
        <div class="vdm-field">
          <label class="vdm-field__label" for="group-name">
            {GROUP_NAME_LABEL}{' '}
            <span aria-hidden="true" class="vdm-field__required">
              *
            </span>
          </label>
          <input
            aria-describedby={nameError}
            aria-invalid={nameError === undefined ? undefined : 'true'}
            autocomplete="off"
            autofocus={errors.name !== null || errors.note === null}
            class={
              nameError === undefined
                ? 'vdm-field__input'
                : 'vdm-field__input vdm-field__input--error'
            }
            id="group-name"
            name="name"
            placeholder={GROUP_NAME_PLACEHOLDER}
            required
            type="text"
            defaultValue={values.name}
          />
          {errors.name === null ? null : (
            <span class="vdm-field__hint vdm-field__hint--error" id="group-name-error">
              {errors.name}
            </span>
          )}
        </div>
        <div class="vdm-field">
          <label class="vdm-field__label" for="group-note">
            {GROUP_NOTE_LABEL} <span class="vdm-field__optional">{OPTIONAL_MARK}</span>
          </label>
          <textarea
            aria-describedby={noteMessage}
            aria-invalid={errors.note === null ? undefined : 'true'}
            autofocus={errors.name === null && errors.note !== null ? true : undefined}
            class={
              errors.note === null
                ? 'vdm-field__input vdm-field__textarea'
                : 'vdm-field__input vdm-field__textarea vdm-field__input--error'
            }
            id="group-note"
            name="note"
            defaultValue={values.note}
            placeholder={GROUP_NOTE_PLACEHOLDER}
            rows={3}
          />
          {errors.note === null ? (
            <span class="vdm-field__hint" id="group-note-hint">
              {GROUP_NOTE_HINT}
            </span>
          ) : (
            <span class="vdm-field__hint vdm-field__hint--error" id="group-note-error">
              {errors.note}
            </span>
          )}
        </div>
      </>
    )
  }
}
