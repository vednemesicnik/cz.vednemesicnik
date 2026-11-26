import * as assert from 'remix/assert'
import { sql } from 'remix/data-table'
import { describe, it } from 'remix/test'

import { appOrigin } from '../../auth/environment.server.ts'
import { createIssueStore } from '../../data/issues.server.ts'
import {
  createTestApp,
  JOB_TOKEN,
  seedAdmin,
  seedArticle,
  seedBatch,
  seedIssue,
  TEST_ENVIRONMENT,
  type TestApp,
  type TestBrowser,
} from '../../test-app.server.ts'

const MARIE = 'marie@vednemesicnik.test'
const ISSUE = 'VDM_2026_7'
const DETAIL = `/issues/${ISSUE}`

function textOf(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replaceAll('&nbsp;', ' ')
    .replaceAll(' ', ' ')
    .replace(/\s+/g, ' ')
    .replace(/ ([.,;?)])/g, '$1')
}

/** The section _Podklady pro tisk_ as text, or `null` when the page has none. */
function section(html: string): string | null {
  let found = /<section aria-labelledby="print-title"[^>]*>(.*?)<\/section>/s.exec(html)
  return found === null ? null : textOf(found[1] ?? '').trim()
}

function call(app: TestApp, path: string, body: unknown): Promise<Response> {
  return app.fetch(
    new Request(new URL(path, appOrigin(TEST_ENVIRONMENT)), {
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${JOB_TOKEN}`, 'Content-Type': 'application/json' },
      method: 'POST',
    }),
  )
}

/** One run of the job that copies every artwork it is handed and reports how it ended. */
async function run(app: TestApp, outcome: 'failed' | 'ok'): Promise<void> {
  let claimed = (await (
    await call(app, '/api/v1/print-handoff/claim', { intervalMinutes: 360 })
  ).json()) as {
    issues: {
      articles: { articleId: number; artworks: { artworkId: number }[] }[]
      issueId: number
    }[]
    runKey: string
  }
  let response = await call(app, '/api/v1/print-handoff/report', {
    issues: claimed.issues.map((issue) => ({
      articles: issue.articles.map((article) => ({
        articleId: article.articleId,
        copy: {
          artworks: article.artworks.map((artwork, index) => ({
            artworkId: artwork.artworkId,
            fileId: `copy-${artwork.artworkId}`,
            name: `obr-0${index + 1}.jpg`,
          })),
          folderId: `print-${article.articleId}`,
          isTextChanged: false,
          lastImageNumber: article.artworks.length,
          textFileId: null,
          textFinalVersionId: null,
        },
      })),
      isComplete: true,
      issueId: issue.issueId,
      sheetId: 'sheet-1',
    })),
    outcome,
    runKey: claimed.runKey,
  })
  assert.equal(response.status, 200)
}

async function issueApp(): Promise<{ app: TestApp; editor: TestBrowser; issueId: number }> {
  let app = await createTestApp()
  await seedAdmin(app, MARIE)
  let issueId = await seedIssue(app, ISSUE)
  let editor = app.browser()
  await editor.signInAs(MARIE, 'Marie Horáková')
  return { app, editor, issueId }
}

describe('Podklady pro tisk in the issue detail (12t)', () => {
  it('says the job has not reported yet, with the folder’s button', async () => {
    let { app, editor } = await issueApp()
    try {
      let html = await (await editor.get(DETAIL)).text()
      assert.equal(
        section(html),
        'Podklady pro tisk Úloha se zatím neohlásila. Otevřít podklady pro tisk (otevře se v nové záložce)',
      )
      assert.ok(html.includes('href="https://drive.google.com/drive/folders/f-VDM_2026_7-print"'))
    } finally {
      await app.close()
    }
  })

  it('counts what the last full run copied and estimates the next run', async () => {
    let { app, editor, issueId } = await issueApp()
    try {
      let article = await seedArticle(app, issueId)
      let batch = await seedBatch(app, article, issueId, { count: 3 })
      await app.database.exec(
        sql`UPDATE artwork_batches SET approved_at = '2026-11-22T10:00:00.000Z',
              consent_file_id = 'c-1' WHERE id = ${batch.id}`,
      )
      await run(app, 'ok')

      let line = section(await (await editor.get(DETAIL)).text()) ?? ''
      assert.match(
        line,
        /^Podklady pro tisk 3 díla · poslední celý běh dnes ve? \d+:\d\d · další běh kolem \d+:\d\d /,
      )
    } finally {
      await app.close()
    }
  })

  it('links to the job’s history after a failed run', async () => {
    let { app, editor } = await issueApp()
    try {
      await run(app, 'failed')
      let html = await (await editor.get(DETAIL)).text()
      assert.match(
        section(html) ?? '',
        /Zatím žádné texty ani díla · poslední celý běh .* · chyba při běhu úlohy/,
      )
      assert.match(html, /<a href="\/settings\/jobs\/print-handoff">chyba\u00a0při/)
    } finally {
      await app.close()
    }
  })

  it('is not on a closed issue nor on an unfinished one', async () => {
    let { app, editor, issueId } = await issueApp()
    try {
      await createIssueStore(app.database).close(issueId, Temporal.Now.instant())
      assert.equal(section(await (await editor.get(DETAIL)).text()), null)

      await seedIssue(app, 'VDM_2026_8', { isComplete: false })
      assert.equal(section(await (await editor.get('/issues/VDM_2026_8')).text()), null)
    } finally {
      await app.close()
    }
  })

  it('lists the job in Úlohy na pozadí', async () => {
    let { app, editor } = await issueApp()
    try {
      let text = textOf(await (await editor.get('/settings/jobs')).text())
      assert.ok(text.includes('Podklady pro tisk'))
      assert.ok(text.includes('schválené texty a díla do složky pro grafika'))
    } finally {
      await app.close()
    }
  })
})
