import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { createIssueStore } from '../data/issues.server.ts'
import { createLinkStore } from '../data/links.server.ts'
import {
  connectDriveAccount,
  createTestApp,
  seedAdmin,
  seedArticle,
  seedBatch,
} from '../test-app.server.ts'

const MARIE = 'marie@vednemesicnik.test'

/* What people typed, each with a one-letter word of its own, which has to stay as typed. */
const ISSUE = 'VDM_2026_6'
const SEEDED_ARTICLE = 'Výstava v Brně a okolí'
const CREATED_ARTICLE = 'Rozhovor s hostem o knihách'
const AUTHOR = 'Jan z Brna'
const PROVIDER = 'Eva z Hradce'
const TYPED = [SEEDED_ARTICLE, CREATED_ARTICLE, AUTHOR, PROVIDER]

/** The one-letter word `keepOneLetterWords` ties, still followed by an ordinary space. */
const UNTIED = /(?<=^|[\s„(])[aikosuvz] \S*/giu

/**
 * The words a person reads on the page: no scripts, styles, title or attributes. A tag stands as
 * a line break, so a word at the start of an element is checked and words of two elements are
 * never glued together.
 */
function readableText(html: string): string {
  return html
    .replace(/<(script|style|title)\b[\s\S]*?<\/\1>/g, '\n')
    .replace(/<!--[\s\S]*?-->/g, '\n')
    .replace(/<[^>]+>/g, '\n')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&')
}

/** The app's own words left untied on the page, after each typed value it shows is taken out. */
function untiedWords(html: string): string[] {
  let text = readableText(html)
  for (let value of TYPED) text = text.replaceAll(value, '\n')
  return [...text.matchAll(UNTIED)].map(([match]) => match)
}

describe('one-letter words on the screens', () => {
  it('keeps the app’s own with the next word and leaves what people typed as typed', async () => {
    let app = await createTestApp()
    try {
      await seedAdmin(app, MARIE)
      await connectDriveAccount(app)
      let editor = app.browser()
      await editor.signInAs(MARIE, 'Marie Horáková')
      /* Through the app, so the issue's folders exist on the fake Drive and an article can be
         created in it. */
      await editor.post('/issues/new', { name: ISSUE }, '/issues/new')
      let issueId = (await createIssueStore(app.database).findByName(ISSUE))?.id ?? 0
      let article = await seedArticle(app, issueId, SEEDED_ARTICLE)
      await seedBatch(app, article, issueId, {
        provider: { email: 'eva@external.test', name: PROVIDER },
      })
      let articleLink = await createLinkStore(app.database).articleLinkOf(issueId)
      assert.ok(articleLink !== null)

      let visitor = app.browser()
      let created = new URLSearchParams({
        formKey: '44444444-4444-4444-8444-444444444444',
        intent: 'create',
        name: CREATED_ARTICLE,
      })
      created.append('author-name', AUTHOR)
      created.append('author-email', 'jan@external.test')
      let pages: Record<string, string> = {
        'article created': await (
          await visitor.send(`/l/${articleLink.key}/article`, created)
        ).text(),
        'article page': await (await visitor.get(`/l/${articleLink.key}/article`)).text(),
        'artworks page': await (await visitor.get(`/l/${article.link.key}/artworks`)).text(),
        'link gone': await (await visitor.get('/l/AAAAAAAAAAAA/article')).text(),
        'sign-in': await (await visitor.get('/sign-in')).text(),
      }

      /* Handed over through the detail, so the next load shows _Dopsáno_, its toast, and the
         warning of the missing proofreaders' address (`12l`). */
      await editor.post(
        `/issues/${ISSUE}/articles/${article.articleId}/handover`,
        {},
        `/issues/${ISSUE}`,
      )
      for (let path of [
        '/',
        '/issues/new',
        `/issues/${ISSUE}`,
        `/issues/${ISSUE}?artworks=all`,
        '/review',
        '/settings',
        '/settings/jobs',
        '/settings/jobs/artwork-replies',
        '/settings/proofreaders',
        '/settings/jobs/proofreading-digest',
      ]) {
        pages[path] = await (await editor.get(path)).text()
      }

      assert.ok(readableText(pages[`/issues/${ISSUE}`] ?? '').includes(SEEDED_ARTICLE))
      assert.ok(readableText(pages[`/issues/${ISSUE}`] ?? '').includes('Dopsáno'))
      assert.ok(readableText(pages['artworks page'] ?? '').includes(SEEDED_ARTICLE))
      assert.ok(readableText(pages['article created'] ?? '').includes(CREATED_ARTICLE))
      assert.ok(readableText(pages[`/issues/${ISSUE}?artworks=all`] ?? '').includes(PROVIDER))
      let untied = Object.entries(pages)
        .map(([page, html]) => [page, untiedWords(html)] as const)
        .filter(([, words]) => words.length > 0)
      assert.equal(JSON.stringify(Object.fromEntries(untied), null, 1), `{}`)
    } finally {
      await app.close()
    }
  })
})
