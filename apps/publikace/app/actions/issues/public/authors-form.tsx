import type { Handle } from 'remix/component'
import { clientEntry, css, on, ref } from 'remix/component'

import {
  checkAuthors,
  type FieldError,
  fieldLabel,
  REQUIRED_LEGEND,
  summaryTitle,
} from '../../../domain/public/article-form.ts'
import {
  AUTHOR_EMAIL_FIELD,
  AUTHOR_NAME_FIELD,
  type AuthorCardView,
  AuthorCards,
} from '../../../ui/public/author-cards/component.tsx'

export type AuthorsFormProps = {
  action: string
  /** A refusal of Drive or of the account, in the dialog over the cards (`12y`). */
  callout: { text: string; title: string } | null
  cancelHref: string
  cards: readonly AuthorCardView[]
  confirmLabel: string
  csrfToken: string
  errors: readonly FieldError[]
  /**
   * After the final version: the cards keep their places and their number, nobody is added or
   * removed, and an address may not be one an agreed author has (`12y`).
   */
  isFinal: boolean
  /** What the dialog showed, which the answer checks: the article and its marking. */
  hidden: readonly { name: string; value: string }[]
  lead: string
  /** What saving sends and to whom, above the buttons, where the editor decides (`12y`). */
  note: string
  pendingLabel: string
}

/** The id of the summary over the cards, which a refused save focuses. */
export const AUTHORS_SUMMARY_ID = 'authors-summary'

const formStyle = css({ display: 'contents' })

const defaultSubmitStyle = css({ display: 'none' })

const noteStyle = css({
  color: 'var(--text-secondary)',
  fontSize: '13px',
  lineHeight: 1.5,
  margin: 0,
})

function ErrorIcon() {
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
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  )
}

/**
 * The form of _Upravit autory_ (`12y`): the cards of `20a` in the dialog, the sentence over the
 * buttons and the buttons.
 *
 * In the browser it checks the cards by the rules of `20b` before anything is sent, keeps the
 * summary on top, adds and removes cards without a round trip, and locks itself with the spinner
 * while the authors are saved. Without the runtime it is an ordinary form, whose _Přidat autora_
 * and _Odebrat_ the server answers by drawing the cards again.
 */
export const AuthorsForm = clientEntry(
  import.meta.url,
  function AuthorsForm(handle: Handle<AuthorsFormProps>) {
    let cards: AuthorCardView[] = [...handle.props.cards]
    let nextKey = Math.max(0, ...cards.map((card) => card.key)) + 1
    let errors: readonly FieldError[] = handle.props.errors
    let shownErrors = handle.props.errors
    let isPending = false
    let form: HTMLFormElement | null = null
    let summary: HTMLElement | null = null

    handle.frame.addEventListener(
      'reloadComplete',
      () => {
        if (!isPending) return
        isPending = false
        handle.update()
      },
      { signal: handle.signal },
    )

    function focusById(id: string): void {
      handle.queueTask(() => document.getElementById(id)?.focus())
    }

    function renumbered(next: AuthorCardView[]): AuthorCardView[] {
      return next.map((card, index) => ({ ...card, number: index + 1 }))
    }

    function addCard(): void {
      cards = renumbered([
        ...cards,
        { email: '', key: nextKey++, kind: 'editable', name: '', number: 0 },
      ])
      handle.update()
      focusById(`author-${cards.length}-name`)
    }

    function removeCard(key: number): void {
      let index = cards.findIndex((card) => card.key === key)
      cards = renumbered(cards.filter((card) => card.key !== key))
      errors = []
      handle.update()
      /* Focus to the card that took its place, or the one before, never to nothing. */
      focusById(`author-${Math.min(index + 1, cards.length)}-name`)
    }

    function onSubmit(event: Event): void {
      if (isPending) {
        event.preventDefault()
        return
      }
      if (form === null) return
      let data = new FormData(form)
      let names = data.getAll(AUTHOR_NAME_FIELD).map(String)
      let emails = data.getAll(AUTHOR_EMAIL_FIELD).map(String)
      let typed = names.map((name, index) => ({ email: emails[index] ?? '', name }))
      let { isFinal } = handle.props
      let editable = cards.filter((card) => card.kind === 'editable')
      let check = checkAuthors(
        typed,
        isFinal
          ? {
              fixed: cards
                .filter((card) => card.kind === 'agreed')
                .map((card) => ({ email: card.email, number: card.number })),
              keepsEmptyCards: true,
              numbers: editable.map((card) => card.number),
            }
          : {},
      )
      if (check.errors.length > 0) {
        event.preventDefault()
        if (!isFinal) {
          /* The cards the check kept, a wholly empty one dropped, so each error stands under the
             card its number names, as it does in the server's answer. */
          cards = check.authors.map((author, index) => ({
            ...author,
            key: nextKey++,
            kind: 'editable' as const,
            number: index + 1,
          }))
        }
        errors = check.errors
        handle.update()
        handle.queueTask(() => summary?.focus())
        return
      }
      errors = []
      isPending = true
      handle.update()
    }

    return () => {
      let props = handle.props
      if (props.errors !== shownErrors) {
        shownErrors = props.errors
        errors = props.errors
        if (errors.length > 0) handle.queueTask(() => summary?.focus())
      }
      return (
        <form
          action={props.action}
          method="post"
          mix={[
            formStyle,
            on<HTMLFormElement, 'submit'>('submit', onSubmit),
            ref((node) => {
              form = node as HTMLFormElement
            }),
          ]}
          noValidate
        >
          {/* Enter submits through the first submit button, which would otherwise be _Odebrat_. */}
          <button
            aria-hidden="true"
            disabled={isPending}
            mix={defaultSubmitStyle}
            name="intent"
            tabIndex={-1}
            type="submit"
            value="save"
          />
          <input name="_csrf" type="hidden" value={props.csrfToken} />
          {props.hidden.map((field) => (
            <input name={field.name} type="hidden" value={field.value} />
          ))}
          <div class="vdm-dialog__body">
            <p class="vdm-dialog__text">{props.lead}</p>
            {props.callout === null ? null : (
              <div class="vdm-callout vdm-callout--error vdm-callout--icon">
                <ErrorIcon />
                <div class="vdm-callout__body">
                  <p class="vdm-callout__title" style={{ margin: '0 0 4px' }}>
                    {props.callout.title}
                  </p>
                  <p style={{ margin: 0 }}>{props.callout.text}</p>
                </div>
              </div>
            )}
            {errors.length === 0 ? null : (
              <div
                class="vdm-callout vdm-callout--error vdm-callout--icon"
                id={AUTHORS_SUMMARY_ID}
                mix={ref((node) => {
                  summary = node as HTMLElement
                })}
                tabIndex={-1}
              >
                <ErrorIcon />
                <div class="vdm-callout__body">
                  <p class="vdm-callout__title" style={{ margin: '0 0 4px' }}>
                    {summaryTitle(errors.length)}
                  </p>
                  <ul class="vdm-callout__list">
                    {errors.map((error) => (
                      <li key={error.key}>
                        <a href={`#${error.key === 'authors' ? 'author-1-name' : error.key}`}>
                          {fieldLabel(error.key)}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            <p class="vdm-form__legend" style={{ margin: 0 }}>
              {REQUIRED_LEGEND}
            </p>
            <AuthorCards
              canAdd={!props.isFinal}
              cards={cards}
              errors={errors}
              isPending={isPending}
              onAdd={addCard}
              onRemove={removeCard}
              removable={props.isFinal ? 'none' : 'all-of-two'}
            />
            <p mix={noteStyle}>{props.note}</p>
          </div>
          <div class="vdm-dialog__actions">
            {isPending ? (
              <button class="vdm-btn vdm-btn--ghost vdm-btn--sm" disabled type="button">
                Zrušit
              </button>
            ) : (
              <a class="vdm-btn vdm-btn--ghost vdm-btn--sm" href={props.cancelHref}>
                Zrušit
              </a>
            )}
            <button
              class="vdm-btn vdm-btn--primary vdm-btn--sm"
              disabled={isPending}
              name="intent"
              type="submit"
              value="save"
            >
              {isPending ? (
                <>
                  <span aria-hidden="true" class="vdm-spinner"></span>
                  {props.pendingLabel}
                </>
              ) : (
                props.confirmLabel
              )}
            </button>
          </div>
        </form>
      )
    }
  },
)
