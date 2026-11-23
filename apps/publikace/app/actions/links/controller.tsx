import { createController } from 'remix/router'

import { requestAssets } from '../../assets.ts'
import {
  type AuthorInput,
  checkArticle,
  DAILY_CAP_ON_SUBMIT,
  DRIVE_UNAVAILABLE_ON_SUBMIT,
  documentUrl,
  type FieldError,
  LIMIT_REACHED_ON_SUBMIT,
  LINK_GONE_ON_SUBMIT,
  MAX_AUTHORS,
  type SubmitMessage,
} from '../../domain/article.ts'
import type { Issue } from '../../domain/issue.ts'
import {
  absoluteUrl,
  isLinkKey,
  type Link,
  linkState,
  PREVIEW_DESCRIPTION,
  previewTitle,
} from '../../domain/link.ts'
import {
  createArticle,
  type CreateArticleOutcome,
  replayedArticle,
} from '../../drive/article-setup.server.ts'
import { Articles, type ArticlesContext } from '../../middleware/articles.server.ts'
import { DriveAccount, type DriveAccountContext } from '../../middleware/drive-account.server.ts'
import { routes } from '../../routes.ts'
import type { LinkPreview } from '../../ui/link-page/component.tsx'
import { ArticleCreatedPage, ArticleFormPage, type PageWarning } from './article-page.tsx'
import { LinkGonePage } from './link-gone-page.tsx'
import { AUTHOR_EMAIL_FIELD, AUTHOR_NAME_FIELD } from './public/article-form.tsx'

/*
 * A form that stands in the way of a send answers with a 4xx: the browser runtime renders a 4xx
 * page into the frame and rejects a 5xx one, so a Drive that does not answer is a 409, as in the
 * dialogs of the editors-in-chief.
 */
const REFUSED = 400
const IN_THE_WAY = 409
const GONE = 410

type LinkContext = {
  get(key: unknown): unknown
  params: { key: string }
  render: (node: JSX.Element, init?: ResponseInit) => Response | Promise<Response>
}

type FormState = {
  authors: readonly AuthorInput[]
  errors?: readonly FieldError[]
  formKey: string
  isClosed?: boolean
  message?: SubmitMessage
  /** Set on an answer to a send, so the island focuses what stands above the form. */
  messageKey?: string
  name: string
  warning?: PageWarning
}

/** What an answer to a send carries for the island to focus: something new every time. */
function answered(state: FormState): FormState {
  return { ...state, messageKey: crypto.randomUUID() }
}

function articlesOf(context: LinkContext): ArticlesContext {
  return context.get(Articles) as ArticlesContext
}

function imageUrl(origin: string): string {
  return absoluteUrl(origin, requestAssets().shareImageHref)
}

function previewOf(origin: string, issue: Issue): LinkPreview {
  return {
    description: PREVIEW_DESCRIPTION,
    imageUrl: imageUrl(origin),
    title: previewTitle(issue.name),
  }
}

/** The link and its issue, or the state that answers `02e`. */
async function resolve(
  context: LinkContext,
): Promise<{ issue: Issue; link: Link; state: 'valid' } | { state: 'gone' | 'unknown' }> {
  let key = context.params.key
  if (!isLinkKey(key)) return { state: 'unknown' }
  let { links, setup } = articlesOf(context)
  let link = await links.findByKey(key)
  if (link === null || link.kind !== 'article') return { state: 'unknown' }
  let issue = await setup.issues.findById(link.issueId)
  let state = linkState(link, issue)
  if (state !== 'valid' || issue === null) return { state: state === 'valid' ? 'unknown' : state }
  return { issue, link, state }
}

function goneResponse(
  context: LinkContext,
  state: 'gone' | 'unknown',
): Response | Promise<Response> {
  return context.render(<LinkGonePage imageUrl={imageUrl(articlesOf(context).origin)} />, {
    status: state === 'gone' ? GONE : 404,
  })
}

/**
 * What the page says under the lead when it opens (`20a`): the account first, because without it
 * nothing can be checked on Drive; then whether the issue's _Články_ is still there.
 */
async function warningOnOpen(context: LinkContext, issue: Issue): Promise<PageWarning | undefined> {
  let driveAccount = context.get(DriveAccount) as DriveAccountContext
  let { status } = await driveAccount.store.state()
  if (status !== 'connected') return 'disconnected'

  let folderId = issue.folderIds.articles
  if (folderId === null) return 'folder-gone'
  let { setup } = articlesOf(context)
  let token = await setup.token()
  if (!token.ok) return token.reason === 'unavailable' ? undefined : 'disconnected'
  let presence = await setup.folders(token.accessToken).presence(folderId)
  return presence === 'gone' ? 'folder-gone' : undefined
}

function renderForm(
  context: LinkContext,
  issue: Issue,
  state: FormState,
  init?: ResponseInit,
): Response | Promise<Response> {
  let { origin } = articlesOf(context)
  return context.render(
    <ArticleFormPage
      action={routes.links.createArticle.href({ key: context.params.key })}
      authors={state.authors}
      errors={state.errors ?? []}
      formKey={state.formKey}
      isClosed={state.isClosed ?? false}
      issueName={issue.name}
      message={state.message}
      messageKey={state.messageKey}
      name={state.name}
      preview={previewOf(origin, issue)}
      warning={state.warning}
    />,
    init,
  )
}

/** `20d`, for a first send and for every resend of the same form. */
function renderCreated(
  context: LinkContext,
  outcome: Extract<CreateArticleOutcome, { kind: 'created' }>,
): Response | Promise<Response> {
  return context.render(
    <ArticleCreatedPage
      anotherHref={routes.links.article.href({ key: context.params.key })}
      articleName={outcome.article.name}
      artworksUrl={outcome.artworksUrl}
      documentUrl={documentUrl(outcome.article.docId)}
      isEveryWelcomeSent={outcome.isEveryWelcomeSent}
      issueName={outcome.issue.name}
      preview={previewOf(articlesOf(context).origin, outcome.issue)}
    />,
  )
}

function formOf(context: LinkContext): {
  authors: AuthorInput[]
  formKey: string
  intent: string
  name: string
} {
  let data = context.get(FormData) as FormData
  let text = (value: FormDataEntryValue | null) => (typeof value === 'string' ? value : '')
  let names = data.getAll(AUTHOR_NAME_FIELD).map(text)
  let emails = data.getAll(AUTHOR_EMAIL_FIELD).map(text)
  let authors = names.map((name, index) => ({ email: emails[index] ?? '', name }))
  let formKey = text(data.get('formKey'))
  return {
    authors: authors.length === 0 ? [{ email: '', name: '' }] : authors,
    /* A send without its key, from a page drawn before this one, gets a key of its own. */
    formKey: /^[0-9a-f-]{36}$/.test(formKey) ? formKey : crypto.randomUUID(),
    intent: text(data.get('intent')),
    name: text(data.get('name')),
  }
}

/** `/l/{key}/article`: the form _Nový článek_, open to whoever has the link (`20`). */
export default function createLinksController() {
  return createController(routes.links, {
    actions: {
      async article(context) {
        let resolved = await resolve(context)
        if (resolved.state !== 'valid') return goneResponse(context, resolved.state)

        return renderForm(context, resolved.issue, {
          authors: [{ email: '', name: '' }],
          formKey: crypto.randomUUID(),
          name: '',
          warning: await warningOnOpen(context, resolved.issue),
        })
      },

      async createArticle(context) {
        let resolved = await resolve(context)
        if (resolved.state === 'unknown') return goneResponse(context, 'unknown')

        let form = formOf(context)
        if (resolved.state !== 'valid') {
          /* A resend of a form whose article exists gets it back, even through a replaced link. */
          let replayed = await replayedArticle(
            articlesOf(context).setup,
            form.formKey,
            context.params.key,
          )
          if (replayed?.kind === 'created') return renderCreated(context, replayed)
          let link = await articlesOf(context).links.findByKey(context.params.key)
          let issue =
            link === null ? null : await articlesOf(context).setup.issues.findById(link.issueId)
          if (issue === null) return goneResponse(context, 'gone')
          return renderForm(
            context,
            issue,
            answered({ ...form, isClosed: true, message: LINK_GONE_ON_SUBMIT }),
            { status: GONE },
          )
        }
        let { issue } = resolved

        /* _Přidat autora_ and _Odebrat_ without the browser runtime: the same form drawn again. */
        let shown = form.authors.slice(0, MAX_AUTHORS)
        if (form.intent === 'add-author') {
          let authors = shown.length >= MAX_AUTHORS ? shown : [...shown, { email: '', name: '' }]
          return renderForm(context, issue, { ...form, authors })
        }
        let removed = /^remove-(\d+)$/.exec(form.intent)
        if (removed !== null) {
          let index = Number(removed[1]) - 1
          let authors = shown.filter((_, position) => position !== index || position === 0)
          return renderForm(context, issue, { ...form, authors })
        }

        let check = checkArticle({ authors: form.authors, name: form.name })
        if (!check.ok) {
          return renderForm(
            context,
            issue,
            { ...form, authors: check.authors, errors: check.errors },
            { status: REFUSED },
          )
        }

        let outcome = await createArticle(articlesOf(context).setup, {
          authors: check.article.authors,
          formKey: form.formKey,
          linkKey: context.params.key,
          name: check.article.name,
        })
        let kept = { ...form, authors: check.article.authors, name: check.article.name }
        switch (outcome.kind) {
          case 'created':
            return renderCreated(context, outcome)
          case 'link-gone':
            return renderForm(
              context,
              issue,
              answered({ ...kept, isClosed: true, message: LINK_GONE_ON_SUBMIT }),
              { status: GONE },
            )
          case 'folder-gone':
            return renderForm(context, issue, answered({ ...kept, warning: 'folder-gone' }), {
              status: IN_THE_WAY,
            })
          case 'limited':
            return renderForm(
              context,
              issue,
              answered({ ...kept, message: LIMIT_REACHED_ON_SUBMIT }),
              { status: IN_THE_WAY },
            )
          case 'daily-cap':
            return renderForm(context, issue, answered({ ...kept, message: DAILY_CAP_ON_SUBMIT }), {
              status: IN_THE_WAY,
            })
          case 'unavailable':
            return renderForm(
              context,
              issue,
              answered({ ...kept, message: DRIVE_UNAVAILABLE_ON_SUBMIT }),
              { status: IN_THE_WAY },
            )
          case 'disconnected':
          case 'not-connected':
            return renderForm(context, issue, answered({ ...kept, warning: 'disconnected' }), {
              status: IN_THE_WAY,
            })
        }
      },
    },
  })
}
