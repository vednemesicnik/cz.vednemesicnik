import { createController } from 'remix/router'

import { shareImageHref } from '../../../assets.ts'
import type { ArtworkRow } from '../../../data/artworks.server.ts'
import {
  ARTWORKS_LINK_GONE_NOTE,
  ARTWORKS_LINK_GONE_TEXT,
  ARTWORKS_LINK_GONE_TITLE,
  type ArtworksMessage,
  DAILY_CAP_ON_SEND,
  DISCARDED_ON_SEND,
  FOLDER_GONE_ON_SEND,
  LINK_GONE_ON_SEND,
  RECIPIENT_LIMIT_ON_SEND,
  SUBMIT_LIMIT_ON_SEND,
  UNAVAILABLE_ON_SEND,
} from '../../../domain/artwork.ts'
import { absoluteUrl, isLinkKey, linkState, PREVIEW_GENERIC_TITLE } from '../../../domain/link.ts'
import {
  type ArtworkFieldError,
  checkArtworks,
  FILE_NAME_HEADER,
  FORM_KEY_HEADER,
  MAX_ARTWORKS,
  MAX_FILE_BYTES,
  type UploadReply,
} from '../../../domain/public/artwork-form.ts'
import type { Bytes } from '../../../drive/artwork-files.server.ts'
import {
  type ArtworksTarget,
  removeArtwork,
  resolveArtworksLink,
  type SubmitOutcome,
  submitArtworks,
  uploadArtwork,
} from '../../../drive/artworks-setup.server.ts'
import { Articles, type ArticlesContext } from '../../../middleware/articles.server.ts'
import { DriveAccount, type DriveAccountContext } from '../../../middleware/drive-account.server.ts'
import { routes } from '../../../routes.ts'
import type { LinkPreview } from '../../../ui/link-page/component.tsx'
import type { PageWarning } from '../article-page.tsx'
import { ArtworksFormPage, ArtworksSentPage } from './page.tsx'
import { LinkGonePage } from '../link-gone-page.tsx'
import {
  ARTWORK_AUTHOR_FIELD,
  ARTWORK_ID_FIELD,
  ARTWORK_SOURCE_FIELD,
  type ArtworkCard,
  PROVIDER_EMAIL_FIELD,
  PROVIDER_NAME_FIELD,
} from './public/artworks-form.tsx'

/* As in the article's controller: a form that stands in the way of a send answers with a 4xx, so
   the browser runtime renders the page into the frame rather than rejecting it. */
const REFUSED = 400
const IN_THE_WAY = 409
const GONE = 410

type LinkContext = {
  get(key: unknown): unknown
  headers: Headers
  params: { key: string }
  render: (node: JSX.Element, init?: ResponseInit) => Response | Promise<Response>
  request: Request
}

type FormState = {
  cards: readonly ArtworkCard[]
  errors?: readonly ArtworkFieldError[]
  formKey: string
  isClosed?: boolean
  message?: ArtworksMessage
  /** Set on an answer to a send, so the island focuses what stands above the form. */
  messageKey?: string
  provider: { email: string; name: string }
  warning?: PageWarning
}

/** What an answer to a send carries for the island to focus: something new every time. */
function answered(state: FormState): FormState {
  return { ...state, messageKey: crypto.randomUUID() }
}

function articlesOf(context: LinkContext): ArticlesContext {
  return context.get(Articles) as ArticlesContext
}

function previewOf(context: LinkContext): LinkPreview {
  return {
    imageUrl: absoluteUrl(articlesOf(context).origin, shareImageHref),
    title: PREVIEW_GENERIC_TITLE,
  }
}

/** `02f` for a link that is not, or no longer, one of artworks: 410 once it was, 404 otherwise. */
async function goneResponse(context: LinkContext): Promise<Response> {
  let key = context.params.key
  let link = isLinkKey(key) ? await articlesOf(context).links.findByKey(key) : null
  let issue =
    link === null || link.kind !== 'artworks'
      ? null
      : await articlesOf(context).artworks.issues.findById(link.issueId)
  let state = link === null || link.kind !== 'artworks' ? 'unknown' : linkState(link, issue)
  return context.render(
    <LinkGonePage
      imageUrl={previewOf(context).imageUrl}
      words={{
        note: ARTWORKS_LINK_GONE_NOTE,
        text: ARTWORKS_LINK_GONE_TEXT,
        title: ARTWORKS_LINK_GONE_TITLE,
      }}
    />,
    { status: state === 'gone' ? GONE : 404 },
  ) as Promise<Response>
}

async function targetOf(context: LinkContext): Promise<ArtworksTarget | null> {
  if (!isLinkKey(context.params.key)) return null
  return resolveArtworksLink(articlesOf(context).artworks, context.params.key)
}

/**
 * What the page says under the lead when it opens (`21a`): the account first, because without it
 * nothing can be checked on Drive; then whether the article folder is still there (`1jv85zum`).
 */
async function warningOnOpen(
  context: LinkContext,
  target: ArtworksTarget,
): Promise<PageWarning | undefined> {
  let driveAccount = context.get(DriveAccount) as DriveAccountContext
  let { status } = await driveAccount.store.state()
  if (status !== 'connected') return 'disconnected'
  let { artworks } = articlesOf(context)
  let token = await artworks.token()
  if (!token.ok) return token.reason === 'unavailable' ? undefined : 'disconnected'
  let presence = await artworks.folders(token.accessToken).presence(target.article.folderId)
  return presence === 'gone' ? 'folder-gone' : undefined
}

function renderForm(
  context: LinkContext,
  articleName: string,
  state: FormState,
  init?: ResponseInit,
): Response | Promise<Response> {
  let key = context.params.key
  return context.render(
    <ArtworksFormPage
      action={routes.links.artworks.submit.href({ key })}
      articleName={articleName}
      cards={state.cards}
      errors={state.errors ?? []}
      formKey={state.formKey}
      isClosed={state.isClosed ?? false}
      message={state.message}
      messageKey={state.messageKey}
      preview={previewOf(context)}
      provider={state.provider}
      uploadAction={routes.links.artworks.upload.href({ key })}
      warning={state.warning}
    />,
    init,
  )
}

function renderSent(
  context: LinkContext,
  outcome: Extract<SubmitOutcome, { kind: 'refused' | 'sent' }>,
): Response | Promise<Response> {
  return context.render(
    <ArtworksSentPage
      action={routes.links.artworks.submit.href({ key: context.params.key })}
      articleName={outcome.articleName}
      artworks={outcome.batch.artworks.map((artwork) => ({
        author: artwork.author,
        name: artwork.originalName,
        source: artwork.source,
      }))}
      isRefused={outcome.kind === 'refused'}
      preview={previewOf(context)}
      provider={{ email: outcome.batch.providerEmail, name: outcome.batch.providerName }}
    />,
  )
}

function text(value: FormDataEntryValue | null | undefined): string {
  return typeof value === 'string' ? value : ''
}

function formOf(context: LinkContext) {
  let data = context.get(FormData) as FormData
  let ids = data.getAll(ARTWORK_ID_FIELD).map(text)
  let authors = data.getAll(ARTWORK_AUTHOR_FIELD).map(text)
  let sources = data.getAll(ARTWORK_SOURCE_FIELD).map(text)
  let artworks = ids
    .slice(0, MAX_ARTWORKS + 1)
    .map((id, index) => ({
      author: authors[index] ?? '',
      id: Number(id),
      source: sources[index] ?? '',
    }))
    .filter((artwork) => Number.isSafeInteger(artwork.id) && artwork.id > 0)
  let formKey = text(data.get('formKey'))
  return {
    artworks,
    /* A send without its key, from a page drawn before this one, gets a key of its own. */
    formKey: /^[0-9a-f-]{36}$/.test(formKey) ? formKey : crypto.randomUUID(),
    intent: text(data.get('intent')),
    provider: {
      email: text(data.get(PROVIDER_EMAIL_FIELD)),
      name: text(data.get(PROVIDER_NAME_FIELD)),
    },
  }
}

/** The page's cards as the server knows them: its unsent uploads, with what the form sent. */
async function cardsOf(
  context: LinkContext,
  formKey: string,
  sent: readonly { author: string; id: number; source: string }[],
): Promise<ArtworkCard[]> {
  let uploads = new Map<number, ArtworkRow>()
  for (let upload of await articlesOf(context).artworks.artworks.unsentByForm(formKey)) {
    if (upload.isReadable) uploads.set(upload.id, upload)
  }
  return sent.flatMap((artwork) => {
    let upload = uploads.get(artwork.id)
    if (upload === undefined) return []
    return [
      {
        author: artwork.author,
        id: upload.id,
        name: upload.originalName,
        size: upload.size,
        source: artwork.source,
      },
    ]
  })
}

/** A body that has not finished arriving by then has stopped: its slot goes to the next one. */
const BODY_DEADLINE_MS = 120_000

/** The body, `too-large` as soon as it passes the size an artwork may have, `cut` past the deadline. */
async function readCapped(request: Request): Promise<Bytes | 'cut' | 'too-large'> {
  let reader = request.body?.getReader()
  if (reader === undefined) return new Uint8Array()
  let isCut = false
  let timer = setTimeout(() => {
    isCut = true
    void reader.cancel()
  }, BODY_DEADLINE_MS)
  let chunks: Uint8Array[] = []
  let total = 0
  try {
    for (;;) {
      let { done, value } = await reader.read()
      if (isCut) return 'cut'
      if (done || value === undefined) break
      total += value.byteLength
      if (total > MAX_FILE_BYTES) {
        await reader.cancel()
        return 'too-large'
      }
      chunks.push(value)
    }
  } catch {
    return 'cut'
  } finally {
    clearTimeout(timer)
  }
  let bytes = new Uint8Array(total)
  let offset = 0
  for (let chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return bytes
}

function reply(body: UploadReply, status: number): Response {
  return Response.json(body, { status })
}

function decodedName(value: string | null): string {
  if (value === null) return ''
  try {
    return decodeURIComponent(value).normalize('NFC').slice(0, 255)
  } catch {
    return ''
  }
}

/** `/l/{key}/artworks`: the page _Nahrání obrazových děl_, open to whoever has the link (`21`). */
export default function createArtworksController() {
  return createController(routes.links.artworks, {
    actions: {
      async show(context) {
        let target = await targetOf(context)
        if (target === null) return goneResponse(context)
        return renderForm(context, target.article.name, {
          cards: [],
          formKey: crypto.randomUUID(),
          provider: { email: '', name: '' },
          warning: await warningOnOpen(context, target),
        })
      },

      /**
       * One file, as the request's raw body: its type in `Content-Type`, its name and the page's
       * form key in headers. Not a form, so `formData()` leaves the body alone and its limits stay
       * as they are; the size is refused from `Content-Length` before anything is read, and again
       * while reading for a body that says nothing or lies.
       */
      async upload(context) {
        let formKey = context.headers.get(FORM_KEY_HEADER) ?? ''
        if (!/^[0-9a-f-]{36}$/.test(formKey)) return reply({ outcome: 'refused' }, REFUSED)
        let length = Number(context.headers.get('Content-Length') ?? '')
        if (Number.isFinite(length) && length > MAX_FILE_BYTES) {
          return reply({ outcome: 'too-large' }, 413)
        }
        let outcome = await uploadArtwork(articlesOf(context).artworks, {
          declaredType: (context.headers.get('Content-Type') ?? '').split(';')[0]?.trim() ?? '',
          fileName: decodedName(context.headers.get(FILE_NAME_HEADER)) || 'soubor',
          formKey,
          linkKey: isLinkKey(context.params.key) ? context.params.key : '',
          readBody: () => readCapped(context.request),
        })
        switch (outcome.kind) {
          case 'uploaded':
          case 'unreadable':
            return reply(
              {
                artwork: {
                  id: outcome.artwork.id,
                  name: outcome.artwork.originalName,
                  size: outcome.artwork.size,
                },
                outcome: outcome.kind,
              },
              201,
            )
          case 'too-large':
            return reply({ outcome: 'too-large' }, 413)
          case 'limited':
            return reply({ outcome: 'limited' }, 429)
          case 'link-gone':
            return reply({ outcome: 'link-gone' }, GONE)
          case 'folder-gone':
            return reply({ outcome: 'folder-gone' }, IN_THE_WAY)
          case 'disconnected':
          case 'not-connected':
            return reply({ outcome: 'disconnected' }, IN_THE_WAY)
          case 'unavailable':
            return reply({ outcome: 'unavailable' }, IN_THE_WAY)
        }
      },

      async remove(context) {
        let data = context.get(FormData) as FormData
        let formKey = text(data.get('formKey'))
        let id = Number(context.params.id)
        if (!/^[0-9a-f-]{36}$/.test(formKey) || !Number.isSafeInteger(id)) {
          return Response.json({ outcome: 'refused' }, { status: REFUSED })
        }
        let outcome = await removeArtwork(articlesOf(context).artworks, {
          artworkId: id,
          formKey,
          linkKey: isLinkKey(context.params.key) ? context.params.key : '',
        })
        return Response.json({ outcome }, { status: outcome === 'link-gone' ? GONE : 200 })
      },

      async submit(context) {
        let form = formOf(context)
        let target = await targetOf(context)
        let setup = articlesOf(context).artworks

        /* _Nahrát další díla_ (`21c`): the form again with the provider kept, under a fresh key,
           with nothing in the address. */
        if (form.intent === 'another') {
          if (target === null) return goneResponse(context)
          return renderForm(context, target.article.name, {
            cards: [],
            formKey: crypto.randomUUID(),
            provider: form.provider,
            warning: await warningOnOpen(context, target),
          })
        }

        let check = checkArtworks({ artworks: form.artworks, provider: form.provider })
        if (target === null) {
          /* A resend of a form whose batch exists gets it back, even through a revoked link. */
          let existing = await setup.artworks.findBatchByFormKey(form.formKey)
          let link = isLinkKey(context.params.key)
            ? await setup.links.findByKey(context.params.key)
            : null
          if (existing?.createdAt != null && link !== null && existing.linkId === link.id) {
            let outcome = await submitArtworks(setup, {
              artworks: form.artworks,
              formKey: form.formKey,
              linkKey: context.params.key,
              provider: form.provider,
            })
            if (outcome.kind === 'sent' || outcome.kind === 'refused') {
              return renderSent(context, outcome)
            }
          }
          let article =
            link?.articleId == null ? null : await setup.articles.findById(link.articleId)
          if (link === null || link.kind !== 'artworks' || article === null) {
            return goneResponse(context)
          }
          return renderForm(
            context,
            article.name,
            answered({
              cards: [],
              formKey: form.formKey,
              isClosed: true,
              message: LINK_GONE_ON_SEND,
              provider: form.provider,
            }),
            { status: GONE },
          )
        }

        let cards = await cardsOf(context, form.formKey, form.artworks)
        let kept: FormState = { cards, formKey: form.formKey, provider: form.provider }
        if (!check.ok) {
          return renderForm(
            context,
            target.article.name,
            { ...kept, errors: check.errors },
            { status: REFUSED },
          )
        }

        let outcome = await submitArtworks(setup, {
          artworks: check.batch.artworks,
          formKey: form.formKey,
          linkKey: context.params.key,
          provider: check.batch.provider,
        })
        kept = { ...kept, provider: check.batch.provider }
        switch (outcome.kind) {
          case 'sent':
          case 'refused':
            return renderSent(context, outcome)
          case 'link-gone':
            return renderForm(
              context,
              target.article.name,
              answered({ ...kept, isClosed: true, message: LINK_GONE_ON_SEND }),
              { status: GONE },
            )
          case 'discarded':
            return renderForm(
              context,
              target.article.name,
              answered({
                ...kept,
                cards: [],
                formKey: crypto.randomUUID(),
                message: DISCARDED_ON_SEND,
              }),
              { status: IN_THE_WAY },
            )
          case 'folder-gone':
            return renderForm(
              context,
              target.article.name,
              answered({ ...kept, message: FOLDER_GONE_ON_SEND, warning: 'folder-gone' }),
              { status: IN_THE_WAY },
            )
          case 'limited':
            return renderForm(
              context,
              target.article.name,
              answered({ ...kept, message: SUBMIT_LIMIT_ON_SEND }),
              { status: IN_THE_WAY },
            )
          case 'recipients':
            return renderForm(
              context,
              target.article.name,
              answered({ ...kept, message: RECIPIENT_LIMIT_ON_SEND }),
              { status: IN_THE_WAY },
            )
          case 'daily-cap':
            return renderForm(
              context,
              target.article.name,
              answered({ ...kept, message: DAILY_CAP_ON_SEND }),
              { status: IN_THE_WAY },
            )
          case 'unavailable':
            return renderForm(
              context,
              target.article.name,
              answered({ ...kept, message: UNAVAILABLE_ON_SEND }),
              { status: IN_THE_WAY },
            )
          /* A card the server no longer holds for this page, one the 24-hour sweep took: the page
             is drawn with what is left, and the island drops the rest. */
          case 'stale':
            return renderForm(context, target.article.name, kept, { status: IN_THE_WAY })
          case 'disconnected':
          case 'not-connected':
            return renderForm(
              context,
              target.article.name,
              answered({ ...kept, warning: 'disconnected' }),
              { status: IN_THE_WAY },
            )
        }
      },
    },
  })
}
