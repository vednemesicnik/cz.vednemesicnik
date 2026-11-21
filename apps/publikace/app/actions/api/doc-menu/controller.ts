import { createController } from 'remix/router'

import type { MembershipCheck } from '../../../auth/group-membership.server.ts'
import type {
  IdentityTokenVerifier,
  VerifiedIdentity,
} from '../../../auth/identity-token.server.ts'
import type { Article, ArticleStore } from '../../../data/articles.server.ts'
import type { IssueStore } from '../../../data/issues.server.ts'
import { documentUrl } from '../../../domain/article.ts'
import {
  decideProofreading,
  type DocMenuDialog,
  PROOFREADING_REFUSED_RESULT,
  type ProofreadingTarget,
  proofreadingMarkedDialog,
  refusedAccountDialog,
} from '../../../domain/doc-menu.ts'
import type { DriveAccessToken } from '../../../drive/access-token.server.ts'
import { createDocPermissions } from '../../../drive/doc-permissions.server.ts'
import { routes } from '../../../routes.ts'

/**
 * The API the article Doc's menu _Publikace_ calls (#50). A click asks twice: once for the
 * confirmation, from the script's server when the menu item runs, and once to record, from the
 * dialog in the browser with `fetch` (`doc-menu-cors.server.ts`). Both carry the token the menu
 * item took as a bearer, and `{ documentId, metaDocumentId }`: the Doc it was clicked in, and the
 * `docId` of the `_meta.json` beside it, which tells a copy of an article apart from a Doc the
 * app never knew.
 *
 * It answers `{ dialog }` for the script to draw, refusals included. Anything else makes the
 * script draw its own _Zkuste to za chvíli znovu_: 503 when Google, Drive or the membership
 * service could not be asked, 429 for an account over its cap, and 401 for a token that ran out
 * while the dialog stood open, which the next click in the menu replaces. Nothing here sets a
 * cookie, and no answer to a caller who is refused says anything of an article.
 */

export type DocMenuDependencies = {
  articles: ArticleStore
  checkMembership: MembershipCheck
  fetch: typeof globalThis.fetch
  issues: IssueStore
  now: () => Temporal.Instant
  token: () => Promise<DriveAccessToken>
  verifyIdentityToken: IdentityTokenVerifier
}

type Call = { documentId: string; metaDocumentId: string | null }

/** Drive IDs are short; anything else is not a call from the menu. */
const MAX_ID_LENGTH = 200

/**
 * The calls one verified account may make in `CALLS_WINDOW_MINUTES` before Drive is asked
 * anything for it. A click is two calls and a proofreader clicks a handful of times, so this
 * stops only a script that walks Doc IDs with the app's Drive account behind it. Over the cap
 * the answer is a 429, which the bound script meets with its own _Zkuste to za chvíli znovu_.
 */
const CALLS_PER_ACCOUNT = 20
const CALLS_WINDOW_MINUTES = 10

/** The counts are in memory: the app is one process on one machine, and a restart forgets them. */
function createCallCounter(now: () => Temporal.Instant) {
  let calls = new Map<string, Temporal.Instant[]>()
  return (email: string): boolean => {
    let at = now()
    let since = at.subtract({ minutes: CALLS_WINDOW_MINUTES })
    let recent = (calls.get(email) ?? []).filter(
      (call) => Temporal.Instant.compare(call, since) > 0,
    )
    if (recent.length >= CALLS_PER_ACCOUNT) {
      calls.set(email, recent)
      return false
    }
    calls.set(email, [...recent, at])
    /* Accounts that went quiet leave, so the map holds only the last window's callers. */
    if (calls.size > 1000) {
      for (let [key, times] of calls) {
        if (times.every((call) => Temporal.Instant.compare(call, since) <= 0)) calls.delete(key)
      }
    }
    return true
  }
}

function isDocumentId(value: unknown): value is string {
  return typeof value === 'string' && value !== '' && value.length <= MAX_ID_LENGTH
}

async function readCall(request: Request): Promise<Call | null> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return null
  }
  if (typeof body !== 'object' || body === null) return null
  let { documentId, metaDocumentId } = body as Record<string, unknown>
  if (!isDocumentId(documentId)) return null
  if (metaDocumentId !== undefined && metaDocumentId !== null && !isDocumentId(metaDocumentId)) {
    return null
  }
  return { documentId, metaDocumentId: metaDocumentId ?? null }
}

function bearerOf(request: Request): string | null {
  let match = /^Bearer (\S+)$/.exec(request.headers.get('Authorization') ?? '')
  return match?.[1] ?? null
}

function answer(dialog: DocMenuDialog): Response {
  return Response.json({ dialog }, { headers: { 'Cache-Control': 'no-store' } })
}

function tooMany(): Response {
  return Response.json(
    { error: 'too_many_requests' },
    {
      headers: { 'Cache-Control': 'no-store', 'Retry-After': String(CALLS_WINDOW_MINUTES * 60) },
      status: 429,
    },
  )
}

function expired(): Response {
  return Response.json(
    { error: 'token_expired' },
    { headers: { 'Cache-Control': 'no-store' }, status: 401 },
  )
}

function unavailable(): Response {
  return Response.json(
    { error: 'unavailable' },
    { headers: { 'Cache-Control': 'no-store' }, status: 503 },
  )
}

export default function createDocMenuController(dependencies: DocMenuDependencies) {
  let isWithinCap = createCallCounter(dependencies.now)

  async function targetOf(article: Article, isCopy: boolean): Promise<ProofreadingTarget> {
    let issue = await dependencies.issues.findById(article.issueId)
    if (issue === null) return { kind: 'unknown' }
    if (isCopy) {
      return {
        articleName: article.name,
        documentUrl: documentUrl(article.docId),
        issueName: issue.name,
        kind: 'copy',
      }
    }
    return {
      articleName: article.name,
      isIssueClosed: issue.closedAt !== null,
      issueName: issue.name,
      kind: 'article',
      proofreading: article.proofreading,
    }
  }

  async function proofreading(request: Request, isConfirmed: boolean): Promise<Response> {
    let call = await readCall(request)
    if (call === null) return Response.json({ error: 'invalid_request' }, { status: 400 })

    let bearer = bearerOf(request)
    let identity =
      bearer === null
        ? { status: 'refused' as const }
        : await dependencies.verifyIdentityToken(bearer)
    if (identity.status === 'unavailable') return unavailable()
    if (identity.status === 'expired') return expired()
    if (identity.status === 'refused')
      return answer(refusedAccountDialog(PROOFREADING_REFUSED_RESULT))
    let account: VerifiedIdentity = identity.identity
    if (!isWithinCap(account.email)) return tooMany()

    let article = await dependencies.articles.findCreatedByDocId(call.documentId)
    let original =
      article === null && call.metaDocumentId !== null && call.metaDocumentId !== call.documentId
        ? await dependencies.articles.findCreatedByDocId(call.metaDocumentId)
        : null

    /* The right to edit is asked of every Doc the call names, before either shapes the answer:
       the Doc clicked in, and the one its `_meta.json` names when that is another. Asking only
       about the Doc the answer is about would let a caller who edits one Doc learn whether any
       other ID is an article. A copy's original is the Doc the dialog then points to. */
    let drive = await dependencies.token()
    if (!drive.ok) return unavailable()
    let permissions = createDocPermissions({
      accessToken: drive.accessToken,
      checkMembership: dependencies.checkMembership,
      fetch: dependencies.fetch,
    })
    let named = [call.documentId]
    if (call.metaDocumentId !== null && call.metaDocumentId !== call.documentId) {
      named.push(call.metaDocumentId)
    }
    let mayEdit: 'no' | 'unavailable' | 'yes' = 'yes'
    for (let documentId of named) {
      let reply = await permissions.canEdit(documentId, account)
      if (reply === 'no') {
        mayEdit = 'no'
        break
      }
      if (reply === 'unavailable') mayEdit = 'unavailable'
    }
    if (mayEdit === 'unavailable') return unavailable()

    let target: ProofreadingTarget =
      article !== null
        ? await targetOf(article, false)
        : original !== null
          ? await targetOf(original, true)
          : { kind: 'unknown' }
    let decision = decideProofreading({
      account: mayEdit === 'yes' ? account : null,
      isConfirmed,
      target,
    })
    if ('heading' in decision) return answer(decision)
    if (article === null) return unavailable()

    if (await dependencies.articles.markProofread(article.id, account, dependencies.now())) {
      return answer(proofreadingMarkedDialog())
    }
    /* Somebody else recorded it between the two calls: their record is the answer. */
    let current = await dependencies.articles.findCreatedByDocId(article.docId)
    if (current === null) return unavailable()
    let again = decideProofreading({ account, isConfirmed, target: await targetOf(current, false) })
    return 'heading' in again ? answer(again) : unavailable()
  }

  return createController(routes.api.docMenu, {
    actions: {
      previewProofreading(context) {
        return proofreading(context.request, false)
      },
      markProofreading(context) {
        return proofreading(context.request, true)
      },
    },
  })
}
