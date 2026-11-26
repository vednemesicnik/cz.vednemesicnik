import * as assert from 'remix/assert'
import { sql } from 'remix/data-table'
import { describe, it } from 'remix/test'

import {
  createTestApp,
  seedArticle,
  seedBatch,
  seedIssue,
  type TestApp,
} from '../test-app.server.ts'
import { createIssueStore } from './issues.server.ts'
import { createRecordStore } from './record.server.ts'

const AT = Temporal.Instant.from('2026-11-23T10:00:00Z')

async function marks(app: TestApp): Promise<string[]> {
  let result = await app.database.exec(
    sql`SELECT kind, issue_id, generation FROM record_marks ORDER BY kind, issue_id`,
  )
  return (result.rows ?? []).map(
    (row) => `${String(row['kind'])}:${Number(row['issue_id'])}@${Number(row['generation'])}`,
  )
}

async function clearMarks(app: TestApp): Promise<void> {
  await app.database.exec(sql`DELETE FROM record_marks`)
}

describe('the record queue’s marks', () => {
  it('mark the Registr and the Evidence once an issue is complete, and never before', async () => {
    let app = await createTestApp()
    try {
      let unfinished = await seedIssue(app, 'VDM_2026_5', { isComplete: false })
      assert.deepEqual(await marks(app), [])

      await createIssueStore(app.database).complete(unfinished, AT)
      let found = await marks(app)
      assert.ok(found.includes(`evidence:${unfinished}@1`))
      assert.ok(found.some((mark) => mark.startsWith('registry:0@')))
    } finally {
      await app.close()
    }
  })

  it('mark the Registr when an issue is closed and reopened', async () => {
    let app = await createTestApp()
    try {
      let issueId = await seedIssue(app)
      await clearMarks(app)
      let issues = createIssueStore(app.database)

      await issues.close(issueId, AT)
      assert.deepEqual(await marks(app), ['registry:0@1'])
      await issues.reopen(issueId)
      assert.deepEqual(await marks(app), ['registry:0@2'])
    } finally {
      await app.close()
    }
  })

  it('mark an issue’s Evidence for its articles and artworks, not for a job’s bookkeeping', async () => {
    let app = await createTestApp()
    try {
      let issueId = await seedIssue(app)
      let article = await seedArticle(app, issueId)
      await clearMarks(app)

      await app.database.exec(
        sql`UPDATE articles SET handed_over_at = ${AT.toString()},
              handed_over_by_email = 'marie@vednemesicnik.test'
            WHERE id = ${article.articleId}`,
      )
      assert.deepEqual(await marks(app), [`evidence:${issueId}@1`])

      await clearMarks(app)
      let batch = await seedBatch(app, article, issueId)
      let afterBatch = await marks(app)
      assert.equal(afterBatch.length, 1)
      assert.ok(afterBatch[0]?.startsWith(`evidence:${issueId}@`))

      await clearMarks(app)
      await app.database.exec(
        sql`UPDATE artwork_batches SET checked_at = ${AT.toString()}, claim_key = 'run-1'
            WHERE id = ${batch.id}`,
      )
      assert.deepEqual(await marks(app), [])

      /* The reply check writes a reply it read before again on every run: the same values. */
      await app.database.exec(
        sql`UPDATE artwork_batches
            SET reply_message_id = reply_message_id, is_exact_consent = is_exact_consent,
              mail_sent_at = mail_sent_at
            WHERE id = ${batch.id}`,
      )
      assert.deepEqual(await marks(app), [])
    } finally {
      await app.close()
    }
  })
})

describe('the record store', () => {
  it('keeps a mark a change bumped while its record was being written', async () => {
    let app = await createTestApp()
    try {
      let issueId = await seedIssue(app)
      let store = createRecordStore(app.database)
      let [first] = (await store.takeDue(AT, 20)).filter((mark) => mark.kind === 'evidence')
      assert.ok(first !== undefined)

      await seedArticle(app, issueId)
      assert.equal(await store.markWritten(first), false)
      let [again] = (await store.takeDue(AT, 20)).filter((mark) => mark.kind === 'evidence')
      assert.ok(again !== undefined)
      assert.equal(await store.markWritten(again), true)
      assert.deepEqual(
        (await store.takeDue(AT, 20)).map((mark) => mark.kind),
        ['registry'],
      )
    } finally {
      await app.close()
    }
  })

  it('puts a failed record off, longer each time, until a change resets it', async () => {
    let app = await createTestApp()
    try {
      let issueId = await seedIssue(app)
      let store = createRecordStore(app.database)
      await app.database.exec(sql`DELETE FROM record_marks WHERE kind = 'registry'`)
      let [mark] = await store.takeDue(AT, 20)
      assert.ok(mark !== undefined)

      await store.markFailed(mark, AT, 'Sheets did not answer')
      assert.deepEqual(await store.takeDue(AT.add({ minutes: 1 }), 20), [])
      let [retried] = await store.takeDue(AT.add({ minutes: 2 }), 20)
      assert.equal(retried?.attempts, 1)

      if (retried !== undefined) await store.markFailed(retried, AT, 'Sheets did not answer')
      assert.deepEqual(await store.takeDue(AT.add({ minutes: 3 }), 20), [])

      await seedArticle(app, issueId)
      let [reset] = await store.takeDue(AT, 20)
      assert.equal(reset?.attempts, 0)
    } finally {
      await app.close()
    }
  })

  it('marks every record once a day, the first pass included', async () => {
    let app = await createTestApp()
    try {
      let first = await seedIssue(app, 'VDM_2026_5')
      let second = await seedIssue(app, 'VDM_2026_6', { isComplete: false })
      let store = createRecordStore(app.database)
      await clearMarks(app)

      assert.equal(await store.markAllIfDue(AT), true)
      assert.deepEqual(
        (await store.takeDue(AT, 20)).map((mark) => `${mark.kind}:${mark.issueId}`),
        [`evidence:${first}`, 'registry:0'],
      )
      assert.ok(second > first)

      await clearMarks(app)
      assert.equal(await store.markAllIfDue(AT.add({ hours: 23 })), false)
      assert.deepEqual(await marks(app), [])
      assert.equal(await store.markAllIfDue(AT.add({ hours: 24 })), true)
    } finally {
      await app.close()
    }
  })

  it('lists the complete issues for the Registr, with their newest article link', async () => {
    let app = await createTestApp()
    try {
      await seedIssue(app, 'VDM_2026_4', { isComplete: false })
      let issueId = await seedIssue(app, 'VDM_2026_5')
      let issues = createIssueStore(app.database)
      await issues.setEvidence(issueId, 'sheet-5')
      await issues.close(issueId, AT)

      let [row, ...rest] = await createRecordStore(app.database).registryIssues()
      assert.deepEqual(rest, [])
      assert.equal(row?.name, 'VDM_2026_5')
      assert.equal(row?.folderId, 'f-VDM_2026_5')
      assert.equal(row?.evidenceId, 'sheet-5')
      assert.equal(row?.isClosed, true)
      assert.equal(row?.articleLinkKey?.length, 12)
    } finally {
      await app.close()
    }
  })
})
