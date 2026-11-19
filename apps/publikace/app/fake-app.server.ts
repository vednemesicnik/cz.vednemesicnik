import { html, type SafeHtml } from 'remix/html-template'

import { appOrigin } from './auth/environment.server.ts'
import { createSessionCookie } from './auth/session.server.ts'
import { createArticleStore } from './data/articles.server.ts'
import { createIssueStore } from './data/issues.server.ts'
import { createLinkStore } from './data/links.server.ts'
import { now } from './domain/time.ts'
import { FAKE_STEPS, type FakeStep } from './drive/fake-drive.server.ts'
import { routes } from './routes.ts'
import {
  connectDriveAccount,
  createTestApp,
  fakeIdentityToken,
  seedAdmin,
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
const ISSUE_NAME = 'VDM_2026_6'
const ARTICLE_NAME = 'Školní jídelna po roce'

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

  async function articlePath(): Promise<string> {
    let link = await links.articleLinkOf(issueId)
    if (link === null) throw new Error('The fake issue has no link for articles.')
    return routes.links.article.href({ key: link.key })
  }

  /** The artworks page of the oldest article, the seeded one: `listCreated` is newest first. */
  async function artworksPath(): Promise<string> {
    let artworks = await links.artworksLinksOf(issueId)
    let first = (await articles.listCreated(issueId)).at(-1)
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
              ? button('/proofread', `Mark proofreading as ${JAKUB.name}`, { id: each.docId })
              : `Proofreading by ${each.proofreading.name ?? each.proofreading.email}`
          }
        </td>
      </tr>`
    })
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
      <p>${button('/sign-in', `Sign in as ${MARIE.email}`)}</p>

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
      case '/proofread': {
        /* The click in the Doc's menu, as the bound script sends it: the Doc made editable for
           anyone with its link, so the Drive check lets the fake proofreader through. */
        if (typeof fileId !== 'string') return new Response('No file', { status: 400 })
        app.drive.share(fileId, { role: 'writer', type: 'anyone' })
        let answer = await app.fetch(
          new Request(new URL(routes.api.docMenu.markProofreading.href(), origin), {
            body: JSON.stringify({ documentId: fileId, metaDocumentId: fileId }),
            headers: {
              Authorization: `Bearer ${fakeIdentityToken(JAKUB)}`,
              'Content-Type': 'application/json',
            },
            method: 'POST',
          }),
        )
        if (answer.status !== 200) return new Response(`The API answered ${answer.status}`)
        return backToControls()
      }
      case '/link/renew':
        await links.renew(issueId, now())
        return backToControls()
      case '/sign-in': {
        /* The session `signInAs()` saves, handed to the browser instead of the harness's jar. */
        let browser = app.browser()
        await browser.signInAs(MARIE.email, MARIE.name)
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
