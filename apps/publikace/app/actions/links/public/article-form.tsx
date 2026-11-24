import type { Handle } from 'remix/component'
import { clientEntry, css, on, ref } from 'remix/component'

import {
  ARTICLE_NAME_LABEL,
  ARTICLE_NAME_PLACEHOLDER,
  type AuthorInput,
  AUTHORS_HINT,
  AUTHORS_LEGEND,
  checkArticle,
  CONSENT_SENTENCE,
  CREATE_ARTICLE_LABEL,
  CREATING_ARTICLE_LABEL,
  type FieldError,
  fieldLabel,
  REQUIRED_LEGEND,
  summaryTitle,
} from '../../../domain/public/article-form.ts'
import {
  AUTHOR_EMAIL_FIELD,
  AUTHOR_NAME_FIELD,
  AuthorCards,
  FormField,
  Required,
} from '../../../ui/public/author-cards/component.tsx'

export type ArticleFormProps = {
  /** The address the form is sent to, the page's own. */
  action: string
  authors: readonly AuthorInput[]
  errors: readonly FieldError[]
  /** The form's one-time key, kept on every answer to the same form (`20c`). */
  formKey: string
  /** The link stopped working meanwhile: the fields stay to be copied, the button goes (`20c`). */
  isClosed: boolean
  /** Changes with every answer that put a message above the form, so the island can focus it. */
  messageKey: string | null
  name: string
}

/** The names the server reads the cards by, one pair per card in the cards' order. */
export { AUTHOR_EMAIL_FIELD, AUTHOR_NAME_FIELD }

/** The id of the Callout above the form, which the island focuses after a refused send. */
export const MESSAGE_ID = 'article-message'

type Card = AuthorInput & { id: number }

const formStyle = css({ display: 'flex', flexDirection: 'column', gap: '20px' })

const consentStyle = css({
  color: 'var(--text-secondary)',
  fontSize: '13px',
  lineHeight: 1.5,
  margin: 0,
})

/* The form's default button for Enter in a field, which would otherwise be the first submit in
   the form: _Odebrat_ or _Přidat autora_. */
const defaultSubmitStyle = css({ display: 'none' })

/**
 * The form _Nový článek_ (`20a`, `20b`, `20c`): the name, the author cards, the consent sentence
 * and _Vytvořit článek_ across the column.
 *
 * In the browser it checks the same rules as the server before anything is sent, keeps the
 * summary on top and the sentence at each field, adds and removes cards without a round trip,
 * and locks itself with the spinner while the article is being made. Without the runtime it is
 * an ordinary form: _Přidat autora_ and _Odebrat_ send it with an `intent` the server answers by
 * drawing the cards again, and the server's check is the only one.
 *
 * The inputs are uncontrolled (`defaultValue`) and each card is keyed, so removing one keeps what
 * was typed into the others, and the names stay in the cards' order for the server.
 */
export const ArticleForm = clientEntry(
  import.meta.url,
  function ArticleForm(handle: Handle<ArticleFormProps>) {
    let nextId = 0
    let cards: Card[] = handle.props.authors.map((author) => ({ ...author, id: nextId++ }))
    let errors: readonly FieldError[] = handle.props.errors
    let shownErrors = handle.props.errors
    let shownMessage = handle.props.messageKey
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

    function addCard(): void {
      cards = [...cards, { email: '', id: nextId++, name: '' }]
      handle.update()
      focusById(`author-${cards.length}-name`)
    }

    function removeCard(id: number): void {
      let index = cards.findIndex((card) => card.id === id)
      cards = cards.filter((card) => card.id !== id)
      errors = []
      handle.update()
      /* Focus to the card that took its place, or the one before, never to nothing. */
      focusById(`author-${Math.min(index + 1, cards.length)}-name`)
    }

    function onSubmit(event: Event): void {
      /* Enter in a read-only field still submits: the article is already on its way. */
      if (isPending) {
        event.preventDefault()
        return
      }
      if (form === null) return
      let data = new FormData(form)
      let names = data.getAll(AUTHOR_NAME_FIELD).map(String)
      let emails = data.getAll(AUTHOR_EMAIL_FIELD).map(String)
      let check = checkArticle({
        authors: names.map((name, index) => ({ email: emails[index] ?? '', name })),
        name: String(data.get('name') ?? ''),
      })
      if (!check.ok) {
        event.preventDefault()
        /* The cards the check kept, a wholly empty one dropped, so each error stands under the
           card its number names, as it does in the server's answer. */
        cards = check.authors.map((author) => ({ ...author, id: nextId++ }))
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
      let { action, formKey, isClosed, name } = handle.props
      if (handle.props.errors !== shownErrors) {
        shownErrors = handle.props.errors
        errors = handle.props.errors
        if (errors.length > 0) handle.queueTask(() => summary?.focus())
      }
      if (handle.props.messageKey !== shownMessage) {
        shownMessage = handle.props.messageKey
        if (shownMessage !== null) focusById(MESSAGE_ID)
      }
      let errorFor = (key: FieldError['key']) => errors.find((error) => error.key === key)?.message

      return (
        <form
          action={action}
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
          {/* Enter submits through the first submit button, which would otherwise be _Odebrat_ or
              _Přidat autora_; disabled, it stops Enter instead while there is nothing to send. */}
          <button
            aria-hidden="true"
            disabled={isClosed || isPending}
            mix={defaultSubmitStyle}
            name="intent"
            tabIndex={-1}
            type="submit"
            value="create"
          />
          <input name="formKey" type="hidden" value={formKey} />
          {errors.length === 0 ? null : (
            <div
              class="vdm-callout vdm-callout--error vdm-callout--icon"
              mix={ref((node) => {
                summary = node as HTMLElement
              })}
              tabIndex={-1}
            >
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
              <div class="vdm-callout__body">
                <p class="vdm-callout__title" style={{ margin: '0 0 4px' }}>
                  {summaryTitle(errors.length)}
                </p>
                <ul class="vdm-callout__list">
                  {errors.map((error) => (
                    <li key={error.key}>
                      <a
                        href={`#${error.key === 'name' ? 'article-name' : error.key === 'authors' ? 'authors' : error.key}`}
                      >
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
          <FormField
            autocomplete="off"
            error={errorFor('name')}
            id="article-name"
            isReadOnly={isPending}
            label={ARTICLE_NAME_LABEL}
            name="name"
            placeholder={ARTICLE_NAME_PLACEHOLDER}
            type="text"
            value={name}
          />
          <fieldset
            aria-describedby={
              errorFor('authors') === undefined ? 'authors-hint' : 'authors-hint authors-error'
            }
            class="vdm-fieldgroup"
            id="authors"
            tabIndex={-1}
          >
            <legend class="vdm-field__label vdm-fieldgroup__legend">
              {AUTHORS_LEGEND}
              <Required />
            </legend>
            <span class="vdm-field__hint" id="authors-hint">
              {AUTHORS_HINT}
            </span>
            {errorFor('authors') === undefined ? null : (
              <span class="vdm-field__hint vdm-field__hint--error" id="authors-error">
                {errorFor('authors')}
              </span>
            )}
            <AuthorCards
              canAdd
              cards={cards.map((card, index) => ({
                email: card.email,
                key: card.id,
                kind: 'editable' as const,
                name: card.name,
                number: index + 1,
              }))}
              errors={errors}
              isPending={isPending}
              onAdd={addCard}
              onRemove={removeCard}
              removable="not-first"
            />
          </fieldset>
          <p mix={consentStyle}>{CONSENT_SENTENCE}</p>
          {isClosed ? null : (
            <button
              class="vdm-btn vdm-btn--primary vdm-btn--lg vdm-btn--full-width"
              disabled={isPending}
              name="intent"
              type="submit"
              value="create"
            >
              {isPending ? (
                <>
                  <span aria-hidden="true" class="vdm-spinner"></span>
                  {CREATING_ARTICLE_LABEL}
                </>
              ) : (
                CREATE_ARTICLE_LABEL
              )}
            </button>
          )}
        </form>
      )
    }
  },
)
