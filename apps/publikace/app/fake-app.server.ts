import { sql } from 'remix/data-table'
import { html, type SafeHtml } from 'remix/html-template'

import { appOrigin } from './auth/environment.server.ts'
import { createSessionCookie } from './auth/session.server.ts'
import { createArticleStore } from './data/articles.server.ts'
import { createJobRunStore } from './data/job-runs.server.ts'
import { batchState } from './domain/artwork.ts'
import { createArtworkStore } from './data/artworks.server.ts'
import { createIssueStore } from './data/issues.server.ts'
import { createLinkStore } from './data/links.server.ts'
import { createProofreadersStore } from './data/proofreaders.server.ts'
import { articleState } from './domain/article.ts'
import { REPLY_CHECK_JOB } from './domain/reply-check.ts'
import { now, parseStamp, stamp } from './domain/time.ts'
import { FAKE_STEPS, type FakeStep } from './drive/fake-drive.server.ts'
import { routes } from './routes.ts'
import {
  connectDriveAccount,
  createTestApp,
  JOB_TOKEN,
  seedAdmin,
  seedArticle,
  seedBatch,
  type TestApp,
} from './test-app.server.ts'

/*
 * The app on the fake Drive, the fake Mailer and a `:memory:` database, for trying the pages in a
 * browser (`pnpm app:fake`). It is the suite's harness served over HTTP, with a page of controls
 * under `/_fake` that exist only here: `createAppRouter()` knows nothing of them, and nothing in
 * this file is reachable from `server.ts`.
 *
 * The seed goes through the app's own forms, as the link tests do, so the issue's folders exist
 * on the fake Drive and the article page finds them.
 */

const MARIE = { email: 'marie@vednemesicnik.test', name: 'Marie Horáková' }
const TEREZA = { email: 'tereza.vlkova@external.test', name: 'Tereza Vlková' }
const JAKUB = { email: 'jakub.novak@vednemesicnik.test', name: 'Jakub Novák' }
const LENKA = { email: 'lenka.svobodova@vednemesicnik.test', name: 'Lenka Svobodová' }
const ISSUE_NAME = 'VDM_2026_6'
const ARTICLE_NAME = 'Školní jídelna po roce'
const PROOFREADERS = 'korektori@vednemesicnik.test'

export const CONTROLS_PATH = '/_fake'

export type FakeApp = {
  /** The seeded issue's pages and the controls, as absolute addresses. */
  addresses(): Promise<{ article: string; artworks: string; controls: string }>
  app: TestApp
  close(): Promise<void>
  /** The controls under `/_fake`; everything else is the app's. */
  fetch(request: Request): Promise<Response>
}

function isFakeStep(value: unknown): value is FakeStep {
  return FAKE_STEPS.some((step) => step === value)
}

function backToControls(): Response {
  return new Response(null, { headers: { Location: CONTROLS_PATH }, status: 303 })
}

function page(body: SafeHtml): Response {
  let document = html`<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Fake app controls</title>
        <style>
          body {
            font:
              15px/1.5 system-ui,
              sans-serif;
            margin: 2rem auto;
            max-width: 48rem;
            padding: 0 1rem;
          }
          h2 {
            font-size: 1rem;
            margin-top: 2rem;
          }
          form {
            display: inline-block;
            margin: 0 0.5rem 0.5rem 0;
          }
          td {
            font-size: 13px;
          }
          table {
            border-collapse: collapse;
          }
          td {
            border-top: 1px solid #ddd;
            padding: 0.25rem 0.75rem 0.25rem 0;
          }
        </style>
      </head>
      <body>
        ${body}
      </body>
    </html>`
  return new Response(String(document), { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

function button(path: string, label: string, fields: Record<string, string> = {}): SafeHtml {
  let hidden = Object.entries(fields).map(
    ([name, value]) => html`<input type="hidden" name="${name}" value="${value}" />`,
  )
  return html`<form method="post" action="${CONTROLS_PATH}${path}">
    ${hidden}<button>${label}</button>
  </form>`
}

export async function createFakeApp(): Promise<FakeApp> {
  let app = await createTestApp()
  let issues = createIssueStore(app.database)
  let links = createLinkStore(app.database)
  let articles = createArticleStore(app.database)
  let batchStore = createArtworkStore(app.database)
  let origin = appOrigin()
  let sessionCookieName = createSessionCookie().name

  /* What the controls set, shown on their page: the fake Drive keeps it but does not tell. */
  let failingSteps = new Set<FakeStep>()
  let isDriveDown = false
  let isMailFailing = false

  await seedAdmin(app, MARIE.email)
  await connectDriveAccount(app)
  let editor = app.browser()
  await editor.signInAs(MARIE.email, MARIE.name)
  let created = await editor.post('/issues/new', { name: ISSUE_NAME }, '/issues/new')
  let issue = await issues.findByName(ISSUE_NAME)
  if (created.status !== 303 || issue === null || issue.completedAt === null) {
    throw new Error(`The fake issue was not created (${created.status}).`)
  }
  let issueId = issue.id
  let articleLink = await links.articleLinkOf(issueId)
  if (articleLink === null) throw new Error('The fake issue has no link for articles.')
  let form = new URLSearchParams({
    formKey: crypto.randomUUID(),
    intent: 'create',
    name: ARTICLE_NAME,
  })
  form.append('author-name', TEREZA.name)
  form.append('author-email', TEREZA.email)
  let sent = await app
    .browser()
    .send(routes.links.createArticle.href({ key: articleLink.key }), form)
  if (sent.status !== 200 || (await links.artworksLinksOf(issueId)).size === 0) {
    throw new Error(`The fake article was not created (${sent.status}).`)
  }

  /* Two more articles, without the form's welcome e-mails: one handed over, one a proofreader
     took, so the detail shows all three states (`12k`). */
  let proofreaders = createProofreadersStore(app.database)
  await proofreaders.save(PROOFREADERS, MARIE.email, now())
  /* Jakub and Lenka proofread through the group, as `korektura@` lets its members in (`10d`). */
  app.setMembership(PROOFREADERS, (email) =>
    email === JAKUB.email || email === LENKA.email
      ? { displayName: null, groupName: 'Korektoři', status: 'member' }
      : { groupName: 'Korektoři', status: 'not-member' },
  )
  let handedOver = await seedArticle(app, issueId, 'Kavárna v knihovně: rok poté')
  await articles.handOver(handedOver.articleId, MARIE, now().subtract({ hours: 26 }))
  let taken = await seedArticle(app, issueId, 'Volební kampaň na sítích')
  await articles.handOver(taken.articleId, MARIE, now().subtract({ hours: 50 }))
  await articles.takeProofreading(
    taken.articleId,
    JAKUB,
    now().subtract({ hours: 20 }),
    'handedOver',
  )

  async function articlePath(): Promise<string> {
    let link = await links.articleLinkOf(issueId)
    if (link === null) throw new Error('The fake issue has no link for articles.')
    return routes.links.article.href({ key: link.key })
  }

  /** The artworks page of the article made through the form, the first one created. */
  async function artworksPath(): Promise<string> {
    let artworks = await links.artworksLinksOf(issueId)
    let first = (await articles.listCreated(issueId)).find((each) => each.name === ARTICLE_NAME)
    let link = first === undefined ? undefined : artworks.get(first.id)
    if (link === undefined) throw new Error('The fake article has no link for artworks.')
    return routes.links.artworks.show.href({ key: link.key })
  }

  async function articlesFolderId(): Promise<string> {
    let current = await issues.findById(issueId)
    let folderId = current?.folderIds.articles ?? null
    if (folderId === null) throw new Error('The fake issue has no folder for articles.')
    return folderId
  }

  async function controlsPage(): Promise<Response> {
    let account = await app.driveAccount.state()
    let folderId = await articlesFolderId()
    let isFolderTrashed = app.drive.files().find((file) => file.id === folderId)?.isTrashed ?? true
    let artworks = await links.artworksLinksOf(issueId)
    let created = await articles.listCreated(issueId)
    let article = await articlePath()

    let driveFiles = app.drive.files()
    /* Each of the article's two folders with what is in it and a way to bin or restore it, as a
       person would on Drive (`12j`). */
    let folderCell = (label: string, id: string | null) => {
      let folder = id === null ? undefined : driveFiles.find((file) => file.id === id)
      if (id === null || folder === undefined) return html`<td>${label}: —</td>`
      let inside = driveFiles.filter((file) => file.parentId === id && !file.isTrashed).length
      return html`<td>
        ${label}: ${inside} ${folder.isTrashed ? '(in the bin)' : ''}
        ${
          folder.isTrashed
            ? button('/file/restore', `Restore ${label}`, { id })
            : button('/file/trash', `Trash ${label}`, { id })
        }
      </td>`
    }
    let artworksRows = created.map((each) => {
      let link = artworks.get(each.id)
      let path = link === undefined ? null : routes.links.artworks.show.href({ key: link.key })
      return html`<tr>
        <td>${each.name}</td>
        <td>${path === null ? '—' : html`<a href="${path}">${path}</a>`}</td>
        ${folderCell('Obrazová díla', each.artworksFolderId)}
        ${folderCell('Licence', each.licencesFolderId)}
        <td>
          ${
            each.proofreading === null
              ? '—'
              : `Proofreading by ${each.proofreading.name ?? each.proofreading.email}`
          }
        </td>
        <td>${articleState(each)}</td>
      </tr>`
    })
    /* Every live batch of the issue, with what a run of the reply check could find for it. */
    let batchRows = (await batchStore.listByIssue(issueId)).map(
      (batch) =>
        html`<tr>
          <td>${batch.articleName}</td>
          <td>${batch.providerName}</td>
          <td>${batchState(batch)}</td>
          <td>
            ${button('/replies', 'Reply “ok, souhlas”', { id: String(batch.id), kind: 'other' })}
            ${button('/replies', 'Reply “Souhlasím”', { id: String(batch.id), kind: 'exact' })}
            ${button('/replies', '“Souhlasím”, archive fails', {
              id: String(batch.id),
              kind: 'exact-fail',
            })}
            ${
              batch.consentVerifiedAt === null
                ? ''
                : button('/replies', 'Archive the decided consent', {
                    id: String(batch.id),
                    kind: 'archive',
                  })
            }
          </td>
        </tr>`,
    )
    let mailRows = app.mail.map(
      (message) =>
        html`<tr>
          <td>${message.to}</td>
          <td>${message.subject}</td>
        </tr>`,
    )

    return page(html`
      <h1>Fake app</h1>
      <p>
        ${ISSUE_NAME} on a fake Drive, a fake Mailer and an in-memory database. A restart starts
        from the seed again, with new keys;
        <a href="${CONTROLS_PATH}/article">/_fake/article</a> and
        <a href="${CONTROLS_PATH}/artworks">/_fake/artworks</a> always lead to the current ones.
      </p>

      <h2>Pages</h2>
      <p>Article page: <a href="${article}">${article}</a></p>
      <table>
        ${artworksRows}
      </table>
      <p>
        ${button('/sign-in', `Sign in as ${MARIE.email}`)}
        ${button('/sign-in/proofreader', `Sign in as ${LENKA.email}, a proofreader`)}
      </p>

      <h2>Link</h2>
      ${button('/link/renew', 'Renew the article link')}

      <h2>Drive</h2>
      <p>
        ${isDriveDown ? 'Down. ' : ''}Failing steps:
        ${failingSteps.size === 0 ? 'none' : [...failingSteps].join(', ')}
      </p>
      <p>
        Fail every call of a step until healed:
        ${FAKE_STEPS.map((step) => button('/drive/fail', step, { step }))}
      </p>
      <p>
        Do the next call of a step but lose its reply:
        ${FAKE_STEPS.map((step) => button('/drive/lose', step, { step }))}
      </p>
      <p>${button('/drive/down', 'Take Drive down')} ${button('/drive/heal', 'Heal Drive')}</p>
      <p>
        The issue's Články folder is ${isFolderTrashed ? 'in the bin' : 'there'}.
        ${
          isFolderTrashed
            ? button('/folder/restore', 'Restore Články')
            : button('/folder/trash', 'Trash Články')
        }
      </p>

      <h2>Drive account</h2>
      <p>
        ${account.status}
        ${
          account.status === 'connected'
            ? button('/account/disconnect', 'Disconnect')
            : button('/account/connect', 'Connect')
        }
      </p>

      <h2>Reply check</h2>
      <p>
        One run of the job through the app's API: it claims the open batches and reports the chosen
        one; <a href="${routes.review.index.href()}">Ke kontrole</a> shows the rest.
      </p>
      <table>
        ${batchRows}
      </table>
      <p>${button('/batch', 'Seed a sent batch of two artworks for the first article')}</p>
      <p>
        ${button('/replies/fail', 'Report a failed run')} — it changes no artwork; two in a row put
        the banner over every editor screen, and any run that ends well takes it away.
      </p>
      <p>
        ${button('/replies/silence', 'Make the job go quiet')} — every run it reported moves two
        hours back, or one that ended well is recorded then: the job is <em>Neběží</em> and the
        banner stands until the next run reports.
      </p>

      <h2>Proofreaders' digest</h2>
      <p>
        Address: ${(await proofreaders.find())?.email ?? 'none'}
        ${button('/proofreaders/clear', 'Remove the address')}
        ${button('/proofreaders/set', `Set ${PROOFREADERS}`)}
      </p>
      <p>
        ${button('/digest', 'Run the digest')} — one run of the job through the app's API, as the
        morning trigger makes it; the digest lands under Mailer below, and
        <a href="${routes.settings.jobs.show.href({ job: 'proofreading-digest' })}">its history</a>
        says what came of it. With the Mailer failing it is not confirmed, and the banner stands.
      </p>

      <h2>Mailer</h2>
      <p>
        ${isMailFailing ? 'Failing.' : 'Sending.'}
        ${
          isMailFailing ? button('/mail/heal', 'Let it send') : button('/mail/fail', 'Make it fail')
        }
      </p>
      <table>
        ${mailRows}
      </table>
    `)
  }

  function job(path: string, body: unknown): Promise<Response> {
    return app.fetch(
      new Request(new URL(path, origin), {
        body: JSON.stringify(body),
        headers: { Authorization: `Bearer ${JOB_TOKEN}`, 'Content-Type': 'application/json' },
        method: 'POST',
      }),
    )
  }

  /**
   * One run of the reply check as the job makes it: claim, then report. The chosen batch gets the
   * reply asked for; the others claimed with it are reported as Reply_Check failing, which
   * changes nothing. A lease left by an earlier run is cleared first, as ten minutes would.
   */
  async function runReplyCheck(
    batch: { consentVerifiedAt: Temporal.Instant | null; id: number; replyText: string | null },
    kind: FormDataEntryValue | null,
  ): Promise<Response> {
    await app.database.exec(sql`UPDATE artwork_batches SET claimed_at = NULL`)
    let claimed = await job(routes.api.artworkReplies.claim.href(), { intervalMinutes: 30 })
    if (claimed.status !== 200) return claimed
    let { batches, runKey } = (await claimed.json()) as {
      batches: { batchId: number }[]
      runKey: string
    }
    let text =
      kind === 'other' ? 'ok, souhlas' : kind === 'archive' ? (batch.replyText ?? '') : 'Souhlasím'
    let reply = {
      messageId:
        kind === 'archive' ? 'fake-message-decided' : `fake-message-${crypto.randomUUID()}`,
      receivedAt: now().toString(),
      text,
      threadId: `fake-thread-${batch.id}`,
    }
    let archive =
      kind === 'exact' || kind === 'archive'
        ? { fileId: `fake-consent-${batch.id}` }
        : kind === 'exact-fail'
          ? { error: 'The fake Drive refused the conversation PDF.' }
          : null
    let results = batches.map((item) =>
      item.batchId !== batch.id
        ? { batchId: item.batchId, state: 'failed' }
        : {
            archive,
            batchId: item.batchId,
            reply,
            state: kind === 'other' || kind === 'archive' ? 'other_reply' : 'reply_matches',
          },
    )
    return job(routes.api.artworkReplies.report.href(), { outcome: 'ok', results, runKey })
  }

  /**
   * One run of the reply check that fails as Reply_Check not answering does: claimed, then reported
   * `failed` with every batch it took left as it was.
   */
  async function failReplyCheck(): Promise<Response> {
    await app.database.exec(sql`UPDATE artwork_batches SET claimed_at = NULL`)
    let claimed = await job(routes.api.artworkReplies.claim.href(), { intervalMinutes: 30 })
    if (claimed.status !== 200) return claimed
    let { batches, runKey } = (await claimed.json()) as {
      batches: { batchId: number }[]
      runKey: string
    }
    return job(routes.api.artworkReplies.report.href(), {
      error: 'Reply check failed: the fake Reply_Check timed out',
      outcome: 'failed',
      results: batches.map((item) => ({ batchId: item.batchId, state: 'failed' })),
      runKey,
    })
  }

  /**
   * The reply check as a job whose trigger was deleted: its runs move two hours back, in their
   * order, so the latest misses two intervals of 30 minutes. A job that never reported gets one
   * run that ended well, since a job with no run is _Zatím se neohlásila_ instead.
   */
  async function silenceReplyCheck(): Promise<void> {
    let result = await app.database.exec(
      sql`SELECT id, started_at, finished_at FROM job_runs WHERE job = ${REPLY_CHECK_JOB}`,
    )
    let rows = result.rows ?? []
    if (rows.length === 0) {
      let runs = createJobRunStore(app.database)
      let runKey = crypto.randomUUID()
      let at = now().subtract({ hours: 2 })
      await runs.start({ at, intervalMinutes: 30, job: REPLY_CHECK_JOB, runKey })
      await runs.finish(REPLY_CHECK_JOB, runKey, { at, error: null, outcome: 'ok' })
      return
    }
    for (let row of rows) {
      let startedAt = parseStamp(row['started_at'])
      let finishedAt = parseStamp(row['finished_at'])
      if (startedAt === null) continue
      await app.database.exec(
        sql`UPDATE job_runs SET started_at = ${stamp(startedAt.subtract({ hours: 2 }))},
              finished_at = ${finishedAt === null ? null : stamp(finishedAt.subtract({ hours: 2 }))}
            WHERE id = ${Number(row['id'])}`,
      )
    }
  }

  async function control(request: Request, path: string): Promise<Response> {
    if (request.method === 'GET') {
      if (path === '') return controlsPage()
      if (path === '/article') return Response.redirect(new URL(await articlePath(), origin), 303)
      if (path === '/artworks') return Response.redirect(new URL(await artworksPath(), origin), 303)
      return new Response('Not Found', { status: 404 })
    }
    if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

    /* A control without a field takes a bare `POST` as well, as `curl -X POST` sends it. */
    let form = request.headers.has('Content-Type') ? await request.formData() : null
    let step = form?.get('step') ?? null
    let fileId = form?.get('id') ?? null
    switch (path) {
      case '/drive/fail':
        if (!isFakeStep(step)) return new Response('Unknown step', { status: 400 })
        app.drive.failStep(step)
        failingSteps.add(step)
        return backToControls()
      case '/drive/lose':
        if (!isFakeStep(step)) return new Response('Unknown step', { status: 400 })
        app.drive.loseReplyOnStep(step)
        return backToControls()
      case '/drive/down':
        app.drive.goDown()
        isDriveDown = true
        return backToControls()
      case '/drive/heal':
        app.drive.heal()
        failingSteps.clear()
        isDriveDown = false
        return backToControls()
      case '/folder/trash':
        app.drive.trash(await articlesFolderId())
        return backToControls()
      case '/folder/restore':
        app.drive.restore(await articlesFolderId())
        return backToControls()
      case '/file/trash':
      case '/file/restore':
        if (typeof fileId !== 'string') return new Response('No file', { status: 400 })
        if (path === '/file/trash') app.drive.trash(fileId)
        else app.drive.restore(fileId)
        return backToControls()
      case '/account/disconnect':
        await app.driveAccount.markDisconnected(now())
        return backToControls()
      case '/account/connect':
        await connectDriveAccount(app)
        return backToControls()
      case '/mail/fail':
        app.failMail(true)
        isMailFailing = true
        return backToControls()
      case '/mail/heal':
        app.failMail(false)
        isMailFailing = false
        return backToControls()
      case '/batch': {
        /* A batch as the artworks page leaves it once the Mailer took the request, without
           uploading files by hand. */
        let first = (await articles.listCreated(issueId)).find((each) => each.name === ARTICLE_NAME)
        let link =
          first === undefined ? undefined : (await links.artworksLinksOf(issueId)).get(first.id)
        if (first === undefined || link === undefined)
          return new Response('No article', { status: 400 })
        await seedBatch(app, { articleId: first.id, link }, issueId, { at: now() })
        return backToControls()
      }
      case '/replies/fail': {
        let answer = await failReplyCheck()
        if (answer.status !== 200) return new Response(`The API answered ${answer.status}`)
        return backToControls()
      }
      case '/digest': {
        let answer = await job(routes.api.proofreadingDigest.run.href(), { intervalMinutes: 1440 })
        if (answer.status !== 200) return new Response(`The API answered ${answer.status}`)
        return backToControls()
      }
      case '/proofreaders/clear':
        /* Nothing in the app clears the address (`14f`); only this control does, to show the
           warnings of a deployment where nobody set it yet. */
        await app.database.exec(sql`DELETE FROM proofreaders`)
        return backToControls()
      case '/proofreaders/set':
        await proofreaders.save(PROOFREADERS, MARIE.email, now())
        return backToControls()
      case '/replies/silence':
        await silenceReplyCheck()
        return backToControls()
      case '/replies': {
        let id = Number(fileId)
        let kind = form?.get('kind') ?? null
        if (kind !== 'other' && kind !== 'exact' && kind !== 'exact-fail' && kind !== 'archive') {
          return new Response('Unknown kind', { status: 400 })
        }
        let batch = await batchStore.findBatch(id)
        if (batch === null) return new Response('No batch', { status: 400 })
        let answer = await runReplyCheck(batch, kind)
        if (answer.status !== 200) return new Response(`The API answered ${answer.status}`)
        return backToControls()
      }
      case '/link/renew':
        await links.renew(issueId, now())
        return backToControls()
      case '/sign-in':
      case '/sign-in/proofreader': {
        /* The session `signInAs()` saves, handed to the browser instead of the harness's jar. */
        let browser = app.browser()
        if (path === '/sign-in') await browser.signInAs(MARIE.email, MARIE.name)
        else {
          await browser.signInAs(LENKA.email, LENKA.name, Date.now() + 60_000, {
            isEditor: false,
            isProofreader: true,
          })
        }
        let value = browser.cookie(sessionCookieName) ?? ''
        return new Response(null, {
          headers: {
            Location: routes.home.href(),
            'Set-Cookie': `${sessionCookieName}=${value}; Path=/; HttpOnly; SameSite=Lax`,
          },
          status: 303,
        })
      }
      default:
        return new Response('Not Found', { status: 404 })
    }
  }

  return {
    async addresses() {
      return {
        article: new URL(await articlePath(), origin).href,
        artworks: new URL(await artworksPath(), origin).href,
        controls: new URL(CONTROLS_PATH, origin).href,
      }
    },
    app,
    close: app.close,
    fetch(request) {
      let { pathname } = new URL(request.url)
      if (pathname === CONTROLS_PATH || pathname.startsWith(`${CONTROLS_PATH}/`)) {
        return control(request, pathname.slice(CONTROLS_PATH.length))
      }
      return app.fetch(request)
    },
  }
}
