import type { Handle } from 'remix/component'
import { css, on } from 'remix/component'

import {
  ADD_AUTHOR_LABEL,
  AUTHOR_EMAIL_LABEL,
  AUTHOR_EMAIL_PLACEHOLDER,
  AUTHOR_LIMIT_NOTE,
  AUTHOR_NAME_LABEL,
  AUTHOR_NAME_PLACEHOLDER,
  authorCardTitle,
  type FieldKey,
  MAX_AUTHORS,
  REMOVE_AUTHOR_LABEL,
  removeAuthorName,
} from '../../../domain/public/article-form.ts'

/** The names the server reads the cards by, one pair per card in the cards' order. */
export const AUTHOR_NAME_FIELD = 'author-name'
export const AUTHOR_EMAIL_FIELD = 'author-email'

/**
 * One card: an author to type, or one who agreed to the final version and is only read (`12y`).
 * `key` stays with the card while others are added and removed, so what was typed stays with it.
 * `hidden` goes with an editable card's fields, in the same order.
 */
export type AuthorCardView =
  | {
      email: string
      hidden?: { name: string; value: string }
      key: number
      kind: 'editable'
      name: string
      number: number
    }
  | {
      agreed: { detail: string | null; label: string }
      email: string
      key: number
      kind: 'agreed'
      name: string
      number: number
    }

const cardsStyle = css({ display: 'flex', flexDirection: 'column', gap: '12px' })

const cardStyle = css({
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  padding: '14px',
})

const cardHeadStyle = css({
  alignItems: 'center',
  display: 'flex',
  justifyContent: 'space-between',
  minHeight: '44px',
})

const cardTitleStyle = css({
  color: 'var(--text-secondary)',
  fontSize: '13px',
  fontWeight: 600,
})

/* Name and e-mail side by side once the column is 520 px wide (`20a`). */
const cardFieldsStyle = css({
  display: 'grid',
  gap: '12px',
  gridTemplateColumns: 'minmax(0, 1fr)',
  '@container (min-width: 520px)': { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
})

const cardsContainerStyle = css({ containerType: 'inline-size' })

/* An agreed author is text beside the tag, which a long address may push onto its own line. */
const agreedRowStyle = css({
  alignItems: 'flex-start',
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px 12px',
  justifyContent: 'space-between',
})

const agreedTextStyle = css({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  overflowWrap: 'anywhere',
})

const agreedNameStyle = css({ color: 'var(--text-primary)', fontSize: '14px' })

const agreedEmailStyle = css({ color: 'var(--text-secondary)', fontSize: '13px' })

export function Required() {
  return () => (
    <>
      {' '}
      <span aria-hidden="true" class="vdm-field__required">
        *
      </span>
    </>
  )
}

export type FormFieldProps = {
  autocomplete: string
  error: string | undefined
  id: string
  isReadOnly: boolean
  label: string
  name: string
  placeholder: string
  type: 'email' | 'text'
  value: string
}

/**
 * A required field of `20a` with its message under it. The input is uncontrolled
 * (`defaultValue`), so a render of the island never undoes what was typed.
 */
export function FormField(handle: Handle<FormFieldProps>) {
  return () => {
    let props = handle.props
    let messageId = `${props.id}-error`
    let inputProps = {
      'aria-describedby': props.error === undefined ? undefined : messageId,
      'aria-invalid': props.error === undefined ? undefined : ('true' as const),
      autocomplete: props.autocomplete,
      class:
        props.error === undefined ? 'vdm-field__input' : 'vdm-field__input vdm-field__input--error',
      defaultValue: props.value,
      id: props.id,
      name: props.name,
      placeholder: props.placeholder,
      readOnly: props.isReadOnly,
      required: true,
    }
    return (
      <div class="vdm-field">
        <label class="vdm-field__label" for={props.id}>
          {props.label}
          <Required />
        </label>
        {props.type === 'email' ? (
          <input {...inputProps} type="email" />
        ) : (
          <input {...inputProps} type="text" />
        )}
        {props.error === undefined ? null : (
          <span class="vdm-field__hint vdm-field__hint--error" id={messageId}>
            {props.error}
          </span>
        )}
      </div>
    )
  }
}

export type AuthorCardsProps = {
  /** _Přidat autora_ under the cards, or the note at the tenth; neither after the final version. */
  canAdd: boolean
  cards: readonly AuthorCardView[]
  errors: readonly { key: FieldKey; message: string }[]
  isPending: boolean
  onAdd(): void
  onRemove(key: number): void
  /** Which cards carry _Odebrat_: none on the first in the form, every one of two or more in `12y`. */
  removable: 'all-of-two' | 'none' | 'not-first'
}

/**
 * The author cards of `20a`, for the form _Nový článek_ and the dialog _Upravit autory_ (`12y`).
 *
 * Without the runtime, _Přidat autora_ and _Odebrat_ send the form with an `intent` the server
 * answers by drawing the cards again; with it, they change the cards in place.
 */
export function AuthorCards(handle: Handle<AuthorCardsProps>) {
  return () => {
    let { canAdd, cards, errors, isPending, onAdd, onRemove, removable } = handle.props
    let errorFor = (key: FieldKey) => errors.find((error) => error.key === key)?.message
    let canRemove = (number: number) =>
      removable === 'all-of-two' ? cards.length >= 2 : removable === 'not-first' && number > 1
    return (
      <div mix={[cardsStyle, cardsContainerStyle]}>
        {cards.map((card) => {
          let number = card.number
          if (card.kind === 'agreed') {
            return (
              <div
                aria-labelledby={`author-${number}-title`}
                key={card.key}
                mix={cardStyle}
                role="group"
              >
                <span id={`author-${number}-title`} mix={cardTitleStyle}>
                  {authorCardTitle(number)}
                </span>
                <div mix={agreedRowStyle}>
                  <span mix={agreedTextStyle}>
                    <span mix={agreedNameStyle}>{card.name}</span>
                    <span mix={agreedEmailStyle}>{card.email}</span>
                  </span>
                  {/* `StatusTag` in tone `done`, written out: an island loads nothing outside
                      `public/`. */}
                  <span class="vdm-status vdm-status--published">
                    <span class="vdm-status__tag">{card.agreed.label}</span>
                    {card.agreed.detail === null ? null : (
                      <span class="vdm-status__detail">{card.agreed.detail}</span>
                    )}
                  </span>
                </div>
              </div>
            )
          }
          return (
            <div
              aria-labelledby={`author-${number}-title`}
              key={card.key}
              mix={cardStyle}
              role="group"
            >
              {card.hidden === undefined ? null : (
                <input name={card.hidden.name} type="hidden" value={card.hidden.value} />
              )}
              <div mix={cardHeadStyle}>
                <span id={`author-${number}-title`} mix={cardTitleStyle}>
                  {authorCardTitle(number)}
                </span>
                {canRemove(number) ? (
                  <button
                    aria-label={removeAuthorName(number)}
                    class="vdm-btn vdm-btn--ghost vdm-btn--sm"
                    disabled={isPending}
                    formNoValidate
                    mix={on('click', (event) => {
                      event.preventDefault()
                      onRemove(card.key)
                    })}
                    name="intent"
                    type="submit"
                    value={`remove-${number}`}
                  >
                    {REMOVE_AUTHOR_LABEL}
                  </button>
                ) : null}
              </div>
              <div mix={cardFieldsStyle}>
                <FormField
                  autocomplete="name"
                  error={errorFor(`author-${number}-name`)}
                  id={`author-${number}-name`}
                  isReadOnly={isPending}
                  label={AUTHOR_NAME_LABEL}
                  name={AUTHOR_NAME_FIELD}
                  placeholder={AUTHOR_NAME_PLACEHOLDER}
                  type="text"
                  value={card.name}
                />
                <FormField
                  autocomplete="email"
                  error={errorFor(`author-${number}-email`)}
                  id={`author-${number}-email`}
                  isReadOnly={isPending}
                  label={AUTHOR_EMAIL_LABEL}
                  name={AUTHOR_EMAIL_FIELD}
                  placeholder={AUTHOR_EMAIL_PLACEHOLDER}
                  type="email"
                  value={card.email}
                />
              </div>
            </div>
          )
        })}
        {!canAdd ? null : cards.length >= MAX_AUTHORS ? (
          <span class="vdm-field__hint">{AUTHOR_LIMIT_NOTE}</span>
        ) : (
          <div>
            <button
              class="vdm-btn vdm-btn--outline"
              disabled={isPending}
              formNoValidate
              mix={on('click', (event) => {
                event.preventDefault()
                onAdd()
              })}
              name="intent"
              type="submit"
              value="add-author"
            >
              {ADD_AUTHOR_LABEL}
            </button>
          </div>
        )}
      </div>
    )
  }
}
