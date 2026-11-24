import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { createArticleStore } from '../../data/articles.server.ts'
import { createIssueStore } from '../../data/issues.server.ts'
import { createLinkStore } from '../../data/links.server.ts'
import {
  connectDriveAccount,
  createTestApp,
  seedAdmin,
  type TestApp,
  type TestBrowser,
} from '../../test-app.server.ts'

const MARIE = 'marie@vednemesicnik.test'
const TEREZA = { email: 'tereza.vlkova@external.test', name: 'Tereza Vlková' }
const DETAIL = '/issues/VDM_2026_5'
const CHECK = '/issues/VDM_2026_5/folders/check'

const ARTICLES_STEP =
  'Obnovte složku Články vydání VDM_2026_5 z koše, nebo ji vraťte na sdílený disk Publikace.'
const ISSUE_STEP =
  'Obnovte složku vydání VDM_2026_5 z koše, nebo ji vraťte na sdílený disk Publikace.'
const ARTICLE_STEP = 'Obnovte složku článku z koše, nebo ji vraťte na sdílený disk Publikace.'

function textOf(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/ ([.,;)])/g, '$1')
}

type Context = {
  app: TestApp
  artworksKey: string
  editor: TestBrowser
  folders: { article: string; articles: string; issue: string }
  newsroomKey: string
  visitor: TestBrowser
}

/** An issue with one article created through its newsroom link, and the article's own link. */
async function withIssue(run: (context: Context) => Promise<void>): Promise<void> {
  let app = await createTestApp()
  try {
    await seedAdmin(app, MARIE)
    await connectDriveAccount(app)
    let editor = app.browser()
    await editor.signInAs(MARIE, 'Marie Horáková')
    await editor.post('/issues/new', { name: 'VDM_2026_5' }, '/issues/new')
    let links = createLinkStore(app.database)
    let newsroom = await links.articleLinkOf(1)
    assert.ok(newsroom !== null)
    let visitor = app.browser()
    let body = new URLSearchParams({
      formKey: '33333333-3333-4333-8333-333333333333',
      intent: 'create',
      name: 'Školní jídelna po roce',
    })
    body.append('author-name', TEREZA.name)
    body.append('author-email', TEREZA.email)
    assert.equal((await visitor.send(`/l/${newsroom.key}/article`, body)).status, 200)
    let [artworks] = [...(await links.artworksLinksOf(1)).values()]
    assert.ok(artworks !== undefined)
    let issue = await createIssueStore(app.database).findById(1)
    let article = await createArticleStore(app.database).findById(1)
    assert.ok(issue?.folderIds.issue != null && issue.folderIds.articles != null)
    assert.ok(article?.folderId != null)
    await run({
      app,
      artworksKey: artworks.key,
      editor,
      folders: {
        article: article.folderId,
        articles: issue.folderIds.articles,
        issue: issue.folderIds.issue,
      },
      newsroomKey: newsroom.key,
      visitor,
    })
  } finally {
    await app.close()
  }
}

async function detailText(context: Context): Promise<string> {
  return textOf(await (await context.editor.get(DETAIL)).text())
}

describe('a missing folder of the issue itself (12j, #134)', () => {
  it('shows a Články the newsroom’s page found in the bin under the header, and counts it', () =>
    withIssue(async (context) => {
      context.app.drive.trash(context.folders.articles)
      let page = textOf(
        await (await context.visitor.get(`/l/${context.newsroomKey}/article`)).text(),
      )
      assert.ok(page.includes('Šéfredakce vidí problém v aplikaci.'))

      let html = await (await context.editor.get(DETAIL)).text()
      let text = textOf(html)
      assert.ok(text.includes(ARTICLES_STEP))
      assert.match(
        text,
        /Z odkazu pro redakci teď nejde založit článek\. Zjištěno \d+\. \d+\. v{1,2}e? ?\d+:\d{2}\./,
      )
      assert.ok(html.includes(`action="${CHECK}"`))
      assert.ok(text.indexOf(ARTICLES_STEP) < text.indexOf('Odkaz pro redakci'))

      let overview = textOf(await (await context.editor.get('/')).text())
      assert.match(overview, /Aktivní 1 0 schválených 0 1/)
    }))

  it('marks Články when the form finds it gone on sending', () =>
    withIssue(async (context) => {
      context.app.drive.trash(context.folders.articles)
      let body = new URLSearchParams({
        formKey: '44444444-4444-4444-8444-444444444444',
        intent: 'create',
        name: 'Druhý článek',
      })
      body.append('author-name', TEREZA.name)
      body.append('author-email', TEREZA.email)
      await context.visitor.send(`/l/${context.newsroomKey}/article`, body)

      let issue = await createIssueStore(context.app.database).findById(1)
      assert.ok(issue?.missing.articles != null)
      assert.equal(issue.missing.issue, null)
    }))

  it('shows one Callout for a binned issue folder, hiding the article’s, and counts it once', () =>
    withIssue(async (context) => {
      context.app.drive.trash(context.folders.issue)
      /* The artworks link marks the article's folder, which is in the bin with the issue's. */
      await context.visitor.get(`/l/${context.artworksKey}/artworks`)
      let article = await createArticleStore(context.app.database).findById(1)
      assert.ok(article?.missing.article != null)

      let text = await detailText(context)
      assert.ok(text.includes(ISSUE_STEP))
      assert.ok(
        text.includes('Z odkazů tohoto vydání teď nejde založit článek ani odeslat díla. Zjištěno'),
      )
      assert.ok(!text.includes(ARTICLE_STEP))
      assert.ok(!text.includes(ARTICLES_STEP))

      let overview = textOf(await (await context.editor.get('/')).text())
      assert.match(overview, /Aktivní 1 0 schválených 0 1/)
    }))

  it('says what Zkontrolovat znovu found, and the step goes once the folder is back', () =>
    withIssue(async (context) => {
      context.app.drive.trash(context.folders.articles)
      await context.visitor.get(`/l/${context.newsroomKey}/article`)
      /* The token from the overview, as a click comes from a detail loaded before the folder
         came back. */
      let check = () => context.editor.post(CHECK, {}, '/')

      assert.equal((await check()).status, 303)
      let still = await detailText(context)
      assert.ok(
        still.includes(
          'Obnovte složku z koše, nebo ji vraťte na sdílený disk Publikace. Stále není dostupná.',
        ),
      )
      assert.ok(still.includes('Zkontrolovat znovu'))

      context.app.drive.restore(context.folders.articles)
      await check()
      let back = await detailText(context)
      assert.ok(back.includes('Složka je zpátky na sdíleném disku Publikace.'))
      assert.ok(!back.includes(ARTICLES_STEP))
    }))

  it('drops every mark when the detail finds the issue folder back, without a toast', () =>
    withIssue(async (context) => {
      context.app.drive.trash(context.folders.issue)
      await context.visitor.get(`/l/${context.newsroomKey}/article`)
      await context.visitor.get(`/l/${context.artworksKey}/artworks`)
      context.app.drive.restore(context.folders.issue)

      let text = await detailText(context)
      assert.ok(!text.includes(ISSUE_STEP))
      assert.ok(!text.includes(ARTICLE_STEP))
      assert.ok(!text.includes('Složka je zpátky'))
      let overview = textOf(await (await context.editor.get('/')).text())
      assert.match(overview, /Aktivní 1 0 schválených 0 —/)
    }))

  it('keeps the step on a closed issue, without Zkontrolovat znovu', () =>
    withIssue(async (context) => {
      context.app.drive.trash(context.folders.articles)
      await context.visitor.get(`/l/${context.newsroomKey}/article`)
      await context.editor.post(`${DETAIL}/close`, { returnTo: 'detail' }, `${DETAIL}/close`)

      let text = await detailText(context)
      assert.ok(text.includes(ARTICLES_STEP))
      assert.ok(!text.includes('Zkontrolovat znovu'))
    }))
})
