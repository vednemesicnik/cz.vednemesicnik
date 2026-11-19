import type { Handle } from 'remix/component'
import { clientEntry, css, on, ref } from 'remix/component'

import {
  ARTWORK_ACCEPT,
  CANCEL_UPLOAD_LABEL,
  ARTWORK_AUTHOR_HINT,
  ARTWORK_AUTHOR_LABEL,
  ARTWORK_SOURCE_LABEL,
  artworkCardTitle,
  type ArtworkFieldError,
  type ArtworkFieldKey,
  artworkFieldLabel,
  ARTWORKS_DISCONNECTED_WARNING,
  ARTWORKS_FOLDER_GONE_WARNING,
  UPLOAD_FOLDER_GONE_TEXT,
  ARTWORKS_HINT,
  ARTWORKS_LEGEND,
  cancelUploadName,
  checkArtworks,
  checkSource,
  CHOOSE_ANOTHER_LABEL,
  CHOOSE_HINT,
  CHOOSE_LABEL,
  choiceRefusal,
  DROP_LEAD,
  dropLine,
  FILE_NAME_HEADER,
  FORM_KEY_HEADER,
  formatSize,
  INTERRUPTED_TEXT,
  LINK_GONE_AFTER_UPLOAD,
  MAX_ARTWORKS,
  PROVIDER_EMAIL_HINT,
  PROVIDER_EMAIL_LABEL,
  PROVIDER_HINT,
  PROVIDER_LEGEND,
  PROVIDER_NAME_LABEL,
  REMOVE_ARTWORK_LABEL,
  removeArtworkName,
  RETRY_LABEL,
  SCRIPT_MISSING_WARNING,
  SENDING_CLOSED_LINE,
  SUBMIT_ARTWORKS_LABEL,
  SUBMITTING_ARTWORKS_LABEL,
  TOO_MANY_NOTE,
  UNREADABLE_TEXT,
  unreadableTitle,
  UPLOAD_CAP_REASON,
  UPLOAD_CAP_WITH_UPLOADS,
  UPLOAD_CAP_WITHOUT_UPLOADS,
  UPLOADED_LABEL,
  type UploadReply,
  UPLOADING_LABEL,
  waitingForUploadNote,
} from '../../../../domain/public/artwork-form.ts'
import { REQUIRED_LEGEND, summaryTitle } from '../../../../domain/public/article-form.ts'

/** An uploaded artwork the server already holds for this page, with what its card said. */
export type ArtworkCard = { author: string; id: number; name: string; size: number; source: string }

export type ArtworksFormProps = {
  /** The address the form is sent to, the page's own. */
  action: string
  cards: readonly ArtworkCard[]
  errors: readonly ArtworkFieldError[]
  /** The form's one-time key: it names the page's uploads and its batch. */
  formKey: string
  /** Nothing more can be sent from this page: the fields stay to be copied, the button goes. */
  isClosed: boolean
  /**
   * The server last found one of the article's folders missing. The page stays open: every
   * upload asks Drive again, and the warning goes once one gets through (`21a`).
   */
  isFolderGone: boolean
  /** Changes with every answer that put a message above the form, so the island can focus it. */
  messageKey: string | null
  provider: { email: string; name: string }
  /** Where each chosen file is sent at once; its removal is under it, `/{id}/remove`. */
  uploadAction: string
}

/** The names the server reads the form by; the cards' three in the cards' order. */
export const PROVIDER_NAME_FIELD = 'provider-name'
export const PROVIDER_EMAIL_FIELD = 'provider-email'
export const ARTWORK_ID_FIELD = 'artwork-id'
export const ARTWORK_AUTHOR_FIELD = 'artwork-author'
export const ARTWORK_SOURCE_FIELD = 'artwork-source'

/** The id of the Callout above the form, which the island focuses after a failed send. */
export const MESSAGE_ID = 'artworks-message'

/** The island's own Callout when the link stopped working during an upload. */
const LINK_GONE_ID = 'artworks-link-gone'

type CardState = 'failed' | 'interrupted' | 'queued' | 'unreadable' | 'uploaded' | 'uploading'

type Card = {
  author: string
  controller: AbortController | null
  file: File | null
  /** The upload's row on the server, once it has one. */
  id: number | null
  key: number
  /**
   * A file the server refused because a folder is missing: nothing of it is on Drive, so the card
   * carries no fields to fill in, only _Odebrat_ (`21a`).
   */
  isRefused: boolean
  /** Why the upload did not go, said on the card: the account, the folder. */
  message: string | null
  name: string
  size: number
  source: string
  sourceError: string | null
  state: CardState
}

const formStyle = css({ display: 'flex', flexDirection: 'column', gap: '20px' })
const stackStyle = css({ display: 'flex', flexDirection: 'column', gap: '12px' })

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

const fileStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  minWidth: 0,
  '& b': {
    fontSize: '14px',
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  '& small': { color: 'var(--text-secondary)', fontSize: '13px' },
})

const failedStyle = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  '& p': { margin: 0 },
})

const actionsStyle = css({ display: 'flex', flexWrap: 'wrap', gap: '8px' })

/* The drawn area: its text grows over two lines on a phone, so its height follows it. */
const dropzoneStyle = css({ flexWrap: 'wrap', height: 'auto', minHeight: '96px' })
const dropTextStyle = css({ flex: '1 1 160px' })

/* The hint for a pointer that can drag, the phone's otherwise (`21a`). */
const touchOnlyStyle = css({ '@media (hover: hover) and (pointer: fine)': { display: 'none' } })
const pointerOnlyStyle = css({
  display: 'none',
  '@media (hover: hover) and (pointer: fine)': { display: 'inline' },
})

const noteStyle = css({ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 })
const refusalStyle = css({ color: 'var(--error-text)', fontSize: '14px', margin: 0 })

/*
 * The warning for a page whose script never started (`21a`, _Skript stránky neběží_): shown at
 * once by `<noscript>`, and otherwise only after ten seconds without the island, so a slow phone
 * never sees it flash. The delay is an animation that ends on `display: block`, which no script
 * has to start; a browser too old to animate `display` keeps it hidden, as it is for everybody
 * whose script runs.
 */
const lateWarningStyle = css({
  '@keyframes publikace-late-warning': { from: { display: 'none' }, to: { display: 'block' } },
  animation: 'publikace-late-warning 0s 10s forwards',
  display: 'none',
  '@media (scripting: none)': { animation: 'none' },
})

/* The form's default button for Enter in a field, which would otherwise be _Odebrat_. */
const defaultSubmitStyle = css({ display: 'none' })

function Required() {
  return () => (
    <>
      {' '}
      <span aria-hidden="true" class="vdm-field__required">
        *
      </span>
    </>
  )
}

function WarningCallout(handle: Handle<{ text: string }>) {
  return () => (
    <div class="vdm-callout vdm-callout--warning vdm-callout--icon">
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
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
      <div class="vdm-callout__body">{handle.props.text}</div>
    </div>
  )
}

function isUploading(card: Card): boolean {
  return card.state === 'queued' || card.state === 'uploading'
}

/**
 * A card that holds the send back: still uploading, or one whose upload did not get through and
 * waits to be tried again or removed. An unreadable file does not: it is never sent.
 */
function isBlocking(card: Card): boolean {
  return isUploading(card) || card.state === 'interrupted' || card.state === 'failed'
}

/** What a card's live region says, so the end of an upload is heard as well as its start. */
function statusOf(card: Card): string {
  if (isUploading(card)) return UPLOADING_LABEL
  if (card.state === 'uploaded') return UPLOADED_LABEL
  if (card.state === 'unreadable') return unreadableTitle(card.name)
  return card.message ?? INTERRUPTED_TEXT
}

/**
 * The form _Nahrání obrazových děl_ (`21a`, `21b`, `21d`): who provides the artworks, a card per
 * artwork with its author and source, and _Odeslat díla_ across the column.
 *
 * Every chosen file uploads at once, one after another, with its own status and _Zrušit_; a weak
 * signal then loses one file, never the batch (`21a`, _Nahrává se hned po výběru_). _Odeslat
 * díla_ waits until every card has uploaded, and sends only the fields: the files are on the
 * server already. The same rules as the server's are checked before anything is sent.
 *
 * Uploading needs this script, so the chooser and the button come from the server disabled and
 * start working once the island runs; until then the page says why (`21a`).
 *
 * The inputs are uncontrolled (`defaultValue`) and each card is keyed, so a card that goes keeps
 * what was typed into the others.
 */
export const ArtworksForm = clientEntry(
  import.meta.url,
  function ArtworksForm(handle: Handle<ArtworksFormProps>) {
    let nextKey = 0
    let isReady = false
    let isPending = false
    let isClosedHere = false
    let isFolderGone = handle.props.isFolderGone
    let shownFolderGone = handle.props.isFolderGone
    let linkGone = false
    let isOver = false
    let overCount = 0
    let refusals: string[] = []
    let capMessage: string | null = null
    let isTooMany = false
    let errors: readonly ArtworkFieldError[] = handle.props.errors
    let shownErrors = handle.props.errors
    let shownFormKey = handle.props.formKey
    let shownCards = handle.props.cards
    let shownMessage = handle.props.messageKey
    let form: HTMLFormElement | null = null
    let summary: HTMLElement | null = null
    let chooser: HTMLInputElement | null = null
    let cards: Card[] = fromProps(handle.props.cards)

    function fromProps(list: readonly ArtworkCard[]): Card[] {
      return list.map((card) => ({
        ...card,
        controller: null,
        file: null,
        key: nextKey++,
        isRefused: false,
        message: null,
        sourceError: null,
        state: 'uploaded' as const,
      }))
    }

    handle.queueTask(() => {
      isReady = true
      handle.update()
    })

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

    function uploadedCards(): Card[] {
      return cards.filter((card) => card.state === 'uploaded')
    }

    /** The error of a field, by the card's place among the uploaded ones, as the server numbers. */
    function errorFor(key: ArtworkFieldKey): string | undefined {
      return errors.find((error) => error.key === key)?.message
    }

    function removeUpload(id: number): void {
      let body = new URLSearchParams({ formKey: handle.props.formKey })
      void fetch(`${handle.props.uploadAction}/${id}/remove`, { body, method: 'POST' }).catch(
        () => undefined,
      )
    }

    function choose(files: readonly File[]): void {
      refusals = []
      capMessage = null
      isTooMany = false
      let room = MAX_ARTWORKS - cards.length
      for (let file of files) {
        let refusal = choiceRefusal(file)
        if (refusal !== null) {
          refusals.push(refusal)
          continue
        }
        if (room <= 0) {
          isTooMany = true
          continue
        }
        room -= 1
        cards.push({
          author: '',
          controller: null,
          file,
          id: null,
          key: nextKey++,
          isRefused: false,
          message: null,
          name: file.name,
          size: file.size,
          source: '',
          sourceError: null,
          state: 'queued',
        })
      }
      handle.update()
      void uploadNext()
    }

    let isRunning = false

    /** One upload at a time, in the order chosen: a weak signal carries one file better than five. */
    async function uploadNext(): Promise<void> {
      if (isRunning) return
      isRunning = true
      try {
        for (;;) {
          let card = cards.find((candidate) => candidate.state === 'queued')
          if (card === undefined || card.file === null) return
          await upload(card, card.file)
        }
      } finally {
        isRunning = false
      }
    }

    async function upload(card: Card, file: File): Promise<void> {
      let controller = new AbortController()
      card.controller = controller
      card.state = 'uploading'
      card.message = null
      handle.update()
      let answer: UploadReply
      try {
        let response = await fetch(handle.props.uploadAction, {
          body: file,
          headers: {
            'Content-Type': file.type === '' ? 'application/octet-stream' : file.type,
            [FILE_NAME_HEADER]: encodeURIComponent(file.name),
            [FORM_KEY_HEADER]: handle.props.formKey,
          },
          method: 'POST',
          signal: controller.signal,
        })
        answer = (await response.json()) as UploadReply
      } catch {
        if (!cards.includes(card)) return
        card.state = 'interrupted'
        card.controller = null
        handle.update()
        return
      }
      card.controller = null
      /* _Zrušit_ goes with the upload; focus on it moves to the card rather than to nothing. */
      if ((document.activeElement as HTMLElement | null)?.dataset['cancel'] === String(card.key)) {
        focusById(`artwork-${card.key}-title`)
      }
      if (!cards.includes(card)) {
        /* Cancelled while the answer was on its way: the server stored it, so it goes again. */
        if ('artwork' in answer) removeUpload(answer.artwork.id)
        return
      }
      switch (answer.outcome) {
        case 'uploaded':
          card.id = answer.artwork.id
          card.state = 'uploaded'
          isFolderGone = false
          break
        case 'unreadable':
          card.id = answer.artwork.id
          card.state = 'unreadable'
          isFolderGone = false
          break
        case 'limited':
          /* The cap stops the whole choice: what waits behind it goes too (`21b`). */
          cards = cards.filter((other) => other !== card && other.state !== 'queued')
          capMessage =
            uploadedCards().length > 0 ? UPLOAD_CAP_WITH_UPLOADS : UPLOAD_CAP_WITHOUT_UPLOADS
          break
        case 'link-gone':
          for (let other of cards) other.controller?.abort()
          cards = uploadedCards()
          linkGone = true
          isClosedHere = true
          focusById(LINK_GONE_ID)
          break
        case 'disconnected':
          card.state = 'failed'
          card.message = ARTWORKS_DISCONNECTED_WARNING
          break
        case 'folder-gone':
          card.state = 'failed'
          card.message = UPLOAD_FOLDER_GONE_TEXT
          /* No _Zkusit znovu_: the file is chosen again once the folder is back (`21a`). */
          card.file = null
          card.isRefused = true
          isFolderGone = true
          break
        case 'too-large':
        case 'not-image':
          cards = cards.filter((other) => other !== card)
          refusals = [...refusals, choiceRefusal(file) ?? INTERRUPTED_TEXT]
          break
        default:
          card.state = 'interrupted'
      }
      handle.update()
    }

    function removeCard(card: Card): void {
      let index = cards.indexOf(card)
      card.controller?.abort()
      if (card.id !== null) removeUpload(card.id)
      cards = cards.filter((other) => other !== card)
      errors = []
      handle.update()
      /* Focus to the card that took its place, or to the chooser, never to nothing. */
      let next = cards[Math.min(index, cards.length - 1)]
      if (next === undefined) handle.queueTask(() => chooser?.focus())
      else focusById(`artwork-${next.key}-title`)
    }

    function retry(card: Card): void {
      if (card.file === null) return
      card.state = 'queued'
      handle.update()
      void uploadNext()
    }

    function chooseAnother(card: Card): void {
      removeCard(card)
      handle.queueTask(() => chooser?.click())
    }

    function checkSourceOf(card: Card, value: string): void {
      card.sourceError = checkSource(value.trim())
      handle.update()
    }

    function onSubmit(event: Event): void {
      if (isPending || cards.some(isBlocking)) {
        event.preventDefault()
        return
      }
      if (form === null) return
      let data = new FormData(form)
      let ids = data.getAll(ARTWORK_ID_FIELD).map(Number)
      let authors = data.getAll(ARTWORK_AUTHOR_FIELD).map(String)
      let sources = data.getAll(ARTWORK_SOURCE_FIELD).map(String)
      let check = checkArtworks({
        artworks: ids.map((id, index) => ({
          author: authors[index] ?? '',
          id,
          source: sources[index] ?? '',
        })),
        provider: {
          email: String(data.get(PROVIDER_EMAIL_FIELD) ?? ''),
          name: String(data.get(PROVIDER_NAME_FIELD) ?? ''),
        },
      })
      if (!check.ok) {
        event.preventDefault()
        errors = check.errors
        handle.update()
        handle.queueTask(() => summary?.focus())
        return
      }
      errors = []
      isPending = true
      handle.update()
    }

    function onDrag(event: DragEvent, isEntering: boolean): void {
      if (!isReady || isClosed() || isPending) return
      event.preventDefault()
      isOver = isEntering
      overCount = event.dataTransfer?.items.length ?? 0
      handle.update()
    }

    function onDrop(event: DragEvent): void {
      if (!isReady || isClosed() || isPending) return
      event.preventDefault()
      isOver = false
      choose([...(event.dataTransfer?.files ?? [])])
    }

    function isClosed(): boolean {
      return handle.props.isClosed || isClosedHere
    }

    function field(props: {
      autocomplete?: string
      error: string | undefined
      hint?: string
      id: string
      isRequired: boolean
      label: string
      name: string | undefined
      onBlur?: (value: string) => void
      type: 'email' | 'text' | 'url'
      value: string
    }) {
      let hintId = `${props.id}-hint`
      let errorId = `${props.id}-error`
      let describedBy = [
        props.hint === undefined ? null : hintId,
        props.error === undefined ? null : errorId,
      ]
        .filter((id) => id !== null)
        .join(' ')
      let inputProps = {
        'aria-describedby': describedBy === '' ? undefined : describedBy,
        'aria-invalid': props.error === undefined ? undefined : ('true' as const),
        autocomplete: props.autocomplete ?? 'off',
        class:
          props.error === undefined
            ? 'vdm-field__input'
            : 'vdm-field__input vdm-field__input--error',
        defaultValue: props.value,
        id: props.id,
        mix:
          props.onBlur === undefined
            ? undefined
            : on<HTMLInputElement, 'blur'>('blur', (event) =>
                props.onBlur?.((event.currentTarget as HTMLInputElement).value),
              ),
        name: props.name,
        readOnly: isPending,
        required: props.isRequired,
      }
      return (
        <div class="vdm-field">
          <label class="vdm-field__label" for={props.id}>
            {props.label}
            {props.isRequired ? <Required /> : null}
          </label>
          {props.type === 'email' ? (
            <input {...inputProps} type="email" />
          ) : props.type === 'url' ? (
            <input {...inputProps} type="url" />
          ) : (
            <input {...inputProps} type="text" />
          )}
          {props.hint === undefined ? null : (
            <span class="vdm-field__hint" id={hintId}>
              {props.hint}
            </span>
          )}
          {props.error === undefined ? null : (
            <span class="vdm-field__hint vdm-field__hint--error" id={errorId}>
              {props.error}
            </span>
          )}
        </div>
      )
    }

    function cardView(card: Card, number: number, uploadedNumber: number | null) {
      let titleId = `artwork-${card.key}-title`
      let isUploaded = card.state === 'uploaded'
      let removeButton = (
        <button
          aria-label={removeArtworkName(number)}
          class="vdm-btn vdm-btn--ghost vdm-btn--sm"
          disabled={isPending}
          mix={on('click', () => removeCard(card))}
          type="button"
        >
          {REMOVE_ARTWORK_LABEL}
        </button>
      )

      if (card.state === 'unreadable') {
        return (
          <div aria-labelledby={titleId} key={card.key} mix={cardStyle} role="group">
            <span id={titleId} mix={cardTitleStyle} tabIndex={-1}>
              {artworkCardTitle(number)}
            </span>
            <span class="vdm-sr-only" role="status">
              {statusOf(card)}
            </span>
            <div mix={failedStyle}>
              <p class="vdm-imagetile__failtext">{unreadableTitle(card.name)}</p>
              <p mix={noteStyle}>{UNREADABLE_TEXT}</p>
            </div>
            <div mix={actionsStyle}>
              <button
                class="vdm-btn vdm-btn--outline vdm-btn--sm"
                disabled={isPending || isClosed()}
                mix={on('click', () => chooseAnother(card))}
                type="button"
              >
                {CHOOSE_ANOTHER_LABEL}
              </button>
              {removeButton}
            </div>
          </div>
        )
      }

      let sourceError =
        card.sourceError ??
        (uploadedNumber === null ? undefined : errorFor(`artwork-${uploadedNumber}-source`))
      return (
        <div aria-labelledby={titleId} key={card.key} mix={cardStyle} role="group">
          <div mix={cardHeadStyle}>
            <span id={titleId} mix={cardTitleStyle} tabIndex={-1}>
              {artworkCardTitle(number)}
            </span>
            {isUploaded || card.state === 'interrupted' || card.state === 'failed'
              ? removeButton
              : null}
          </div>
          <span class="vdm-sr-only" role="status">
            {statusOf(card)}
          </span>
          <div mix={fileStyle}>
            <b>{card.name}</b>
            <small>
              {formatSize(card.size)}
              {isUploaded ? ` · ${UPLOADED_LABEL}` : null}
            </small>
          </div>
          {isUploading(card) ? (
            <div class="vdm-upload">
              <div class="vdm-upload__row">
                <span aria-hidden="true" class="vdm-upload__text">
                  {UPLOADING_LABEL}
                </span>
                <button
                  aria-label={cancelUploadName(card.name)}
                  class="vdm-upload__cancel"
                  data-cancel={String(card.key)}
                  mix={on('click', () => removeCard(card))}
                  type="button"
                >
                  {CANCEL_UPLOAD_LABEL}
                </button>
              </div>
              <div aria-label={UPLOADING_LABEL} class="vdm-upload__track" role="progressbar">
                <div class="vdm-upload__bar"></div>
              </div>
            </div>
          ) : null}
          {card.state === 'interrupted' || card.state === 'failed' ? (
            <div mix={failedStyle}>
              <p class="vdm-imagetile__failtext">{card.message ?? INTERRUPTED_TEXT}</p>
              {card.file === null || isClosed() ? null : (
                <div>
                  <button
                    class="vdm-btn vdm-btn--outline vdm-btn--sm"
                    mix={on('click', () => retry(card))}
                    type="button"
                  >
                    {RETRY_LABEL}
                  </button>
                </div>
              )}
            </div>
          ) : null}
          {isUploaded ? (
            <input name={ARTWORK_ID_FIELD} type="hidden" value={String(card.id)} />
          ) : null}
          {card.isRefused
            ? null
            : field({
                error:
                  uploadedNumber === null
                    ? undefined
                    : errorFor(`artwork-${uploadedNumber}-author`),
                hint: ARTWORK_AUTHOR_HINT,
                id: `artwork-${card.key}-author`,
                isRequired: false,
                label: ARTWORK_AUTHOR_LABEL,
                name: isUploaded ? ARTWORK_AUTHOR_FIELD : undefined,
                type: 'text',
                value: card.author,
              })}
          {card.isRefused
            ? null
            : field({
                error: sourceError ?? undefined,
                id: `artwork-${card.key}-source`,
                isRequired: false,
                label: ARTWORK_SOURCE_LABEL,
                name: isUploaded ? ARTWORK_SOURCE_FIELD : undefined,
                onBlur: (value) => checkSourceOf(card, value),
                type: 'url',
                value: card.source,
              })}
        </div>
      )
    }

    return () => {
      let { action, formKey, provider } = handle.props
      if (formKey !== shownFormKey) {
        /* A new form (_Nahrát další díla_, or a batch the editors discarded): its own cards. */
        shownFormKey = formKey
        shownCards = handle.props.cards
        cards = fromProps(handle.props.cards)
        refusals = []
        capMessage = null
        linkGone = false
        isClosedHere = false
      }
      if (handle.props.cards !== shownCards) {
        /* The server's answer lists the uploads it still holds for this page: a card it no
           longer has (one the 24-hour sweep took) goes, the ones still uploading stay. */
        shownCards = handle.props.cards
        let held = new Set(handle.props.cards.map((card) => card.id))
        cards = cards.filter((card) => card.state !== 'uploaded' || held.has(card.id ?? -1))
      }
      if (handle.props.errors !== shownErrors) {
        shownErrors = handle.props.errors
        errors = handle.props.errors
        if (errors.length > 0) handle.queueTask(() => summary?.focus())
      }
      if (handle.props.isFolderGone !== shownFolderGone) {
        shownFolderGone = handle.props.isFolderGone
        isFolderGone = shownFolderGone
      }
      if (handle.props.messageKey !== shownMessage) {
        shownMessage = handle.props.messageKey
        if (shownMessage !== null) focusById(MESSAGE_ID)
      }

      let closed = isClosed()
      let canChoose = isReady && !closed && !isPending
      let waiting = cards.findIndex(isBlocking)
      let canSend = isReady && waiting === -1 && uploadedCards().length > 0
      let uploadedNumber = 0

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
          <button
            aria-hidden="true"
            disabled={closed || isPending || !canSend}
            mix={defaultSubmitStyle}
            tabIndex={-1}
            type="submit"
          />
          <input name="formKey" type="hidden" value={formKey} />
          {/* Gone without a word to a screen reader: only a limit stops applying (`21a`). */}
          {isFolderGone ? <WarningCallout text={ARTWORKS_FOLDER_GONE_WARNING} /> : null}
          {isReady ? null : (
            <>
              <noscript>
                <WarningCallout text={SCRIPT_MISSING_WARNING} />
              </noscript>
              <div mix={lateWarningStyle}>
                <WarningCallout text={SCRIPT_MISSING_WARNING} />
              </div>
            </>
          )}
          {linkGone ? (
            <div id={LINK_GONE_ID} role="alert" tabIndex={-1}>
              <div class="vdm-callout vdm-callout--error vdm-callout--icon">
                <div class="vdm-callout__body">
                  <p class="vdm-callout__title" style={{ margin: '0 0 4px' }}>
                    {LINK_GONE_AFTER_UPLOAD.title}
                  </p>
                  <p style={{ margin: 0 }}>{LINK_GONE_AFTER_UPLOAD.text}</p>
                </div>
              </div>
            </div>
          ) : null}
          {errors.length === 0 ? null : (
            <div
              class="vdm-callout vdm-callout--error vdm-callout--icon"
              mix={ref((node) => {
                summary = node as HTMLElement
              })}
              tabIndex={-1}
            >
              <div class="vdm-callout__body">
                <p class="vdm-callout__title" style={{ margin: '0 0 4px' }}>
                  {summaryTitle(errors.length)}
                </p>
                <ul class="vdm-callout__list">
                  {errors.map((error) => (
                    <li key={error.key}>
                      <a href={`#${anchorOf(error.key, cards)}`}>{labelOf(error.key, cards)}</a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <p class="vdm-form__legend" style={{ margin: 0 }}>
            {REQUIRED_LEGEND}
          </p>
          <fieldset aria-describedby="provider-hint" class="vdm-fieldgroup">
            <legend class="vdm-field__label vdm-fieldgroup__legend">{PROVIDER_LEGEND}</legend>
            <span class="vdm-field__hint" id="provider-hint">
              {PROVIDER_HINT}
            </span>
            <div mix={stackStyle}>
              {field({
                autocomplete: 'name',
                error: errorFor('provider-name'),
                id: 'provider-name',
                isRequired: true,
                label: PROVIDER_NAME_LABEL,
                name: PROVIDER_NAME_FIELD,
                type: 'text',
                value: provider.name,
              })}
              {field({
                autocomplete: 'email',
                error: errorFor('provider-email'),
                hint: PROVIDER_EMAIL_HINT,
                id: 'provider-email',
                isRequired: true,
                label: PROVIDER_EMAIL_LABEL,
                name: PROVIDER_EMAIL_FIELD,
                type: 'email',
                value: provider.email,
              })}
            </div>
          </fieldset>
          <fieldset
            aria-describedby={
              errorFor('artworks') === undefined ? 'artworks-hint' : 'artworks-hint artworks-error'
            }
            class="vdm-fieldgroup"
            id="artworks"
            tabIndex={-1}
          >
            <legend class="vdm-field__label vdm-fieldgroup__legend">
              {ARTWORKS_LEGEND}
              <Required />
            </legend>
            <span class="vdm-field__hint" id="artworks-hint">
              {ARTWORKS_HINT}
            </span>
            {errorFor('artworks') === undefined ? null : (
              <span class="vdm-field__hint vdm-field__hint--error" id="artworks-error">
                {errorFor('artworks')}
              </span>
            )}
            <div mix={stackStyle}>
              {cards.map((card, index) => {
                let number = card.state === 'uploaded' ? ++uploadedNumber : null
                return cardView(card, index + 1, number)
              })}
              {cards.length >= MAX_ARTWORKS || closed ? null : (
                <label
                  class={isOver ? 'vdm-dropzone vdm-dropzone--over' : 'vdm-dropzone'}
                  mix={[
                    dropzoneStyle,
                    on<HTMLLabelElement, 'dragenter'>('dragenter', (event) => onDrag(event, true)),
                    on<HTMLLabelElement, 'dragover'>('dragover', (event) => onDrag(event, true)),
                    on<HTMLLabelElement, 'dragleave'>('dragleave', (event) => onDrag(event, false)),
                    on<HTMLLabelElement, 'drop'>('drop', onDrop),
                  ]}
                >
                  <input
                    accept={ARTWORK_ACCEPT}
                    disabled={!canChoose}
                    mix={[
                      on<HTMLInputElement, 'change'>('change', (event) => {
                        let input = event.currentTarget as HTMLInputElement
                        choose([...(input.files ?? [])])
                        input.value = ''
                      }),
                      ref((node) => {
                        chooser = node as HTMLInputElement
                      }),
                    ]}
                    multiple
                    type="file"
                  />
                  {isOver ? (
                    <span style={{ fontWeight: 500 }}>{dropLine(overCount)}</span>
                  ) : (
                    <>
                      <span mix={dropTextStyle}>
                        <span mix={touchOnlyStyle}>{CHOOSE_HINT}</span>
                        <span mix={pointerOnlyStyle}>{DROP_LEAD}</span>
                      </span>
                      <span class="vdm-btn vdm-btn--outline vdm-btn--sm">{CHOOSE_LABEL}</span>
                    </>
                  )}
                </label>
              )}
              {cards.length >= MAX_ARTWORKS || isTooMany ? (
                <p mix={noteStyle}>{TOO_MANY_NOTE}</p>
              ) : null}
              {refusals.map((refusal, index) => (
                <p key={index} mix={refusalStyle} role="alert">
                  {refusal}
                </p>
              ))}
              {capMessage === null ? null : (
                <p mix={refusalStyle} role="alert">
                  {capMessage} {UPLOAD_CAP_REASON}
                </p>
              )}
            </div>
          </fieldset>
          {closed ? (
            <p mix={noteStyle}>{SENDING_CLOSED_LINE}</p>
          ) : (
            <>
              <button
                class="vdm-btn vdm-btn--primary vdm-btn--lg vdm-btn--full-width"
                disabled={isPending || !canSend}
                type="submit"
              >
                {isPending ? (
                  <>
                    <span aria-hidden="true" class="vdm-spinner"></span>
                    {SUBMITTING_ARTWORKS_LABEL}
                  </>
                ) : (
                  SUBMIT_ARTWORKS_LABEL
                )}
              </button>
              {waiting === -1 ? null : <p mix={noteStyle}>{waitingForUploadNote(waiting + 1)}</p>}
            </>
          )}
        </form>
      )
    }
  },
)

/**
 * The label of the field an error points at. An error names a card by its place among the
 * uploaded ones, as the server numbers them; the label names it by the number on its card.
 */
function labelOf(key: ArtworkFieldKey, cards: readonly Card[]): string {
  let match = /^artwork-(\d+)-(author|source)$/.exec(key)
  if (match === null) return artworkFieldLabel(key)
  let card = cards.filter((candidate) => candidate.state === 'uploaded')[Number(match[1]) - 1]
  let number = card === undefined ? Number(match[1]) : cards.indexOf(card) + 1
  return artworkFieldLabel(`artwork-${number}-${match[2] as 'author' | 'source'}`)
}

/** The field an error's link in the summary leads to. */
function anchorOf(key: ArtworkFieldKey, cards: readonly Card[]): string {
  if (key === 'artworks') return 'artworks'
  if (key === 'provider-name' || key === 'provider-email') return key
  let match = /^artwork-(\d+)-(author|source)$/.exec(key)
  let card = cards.filter((candidate) => candidate.state === 'uploaded')[
    Number(match?.[1] ?? 0) - 1
  ]
  return card === undefined ? 'artworks' : `artwork-${card.key}-${match?.[2] ?? 'author'}`
}
