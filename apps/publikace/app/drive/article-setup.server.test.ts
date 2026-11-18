import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { createArticleStore } from '../data/articles.server.ts'
import { createIssueStore } from '../data/issues.server.ts'
import { createLinkStore } from '../data/links.server.ts'
import { createPublicMailLog } from '../data/public-mail.server.ts'
import { now } from '../domain/time.ts'
import type { Mailer, MailMessage } from '../mail/mailer.server.ts'
import { createTestApp, TEST_ISSUES_FOLDER, type TestApp } from '../test-app.server.ts'
import type { DriveAccessToken } from './access-token.server.ts'
import { createArticleFiles } from './article-files.server.ts'
import {
  type ArticleSetup,
  cleanUpAbandoned,
  createArticle,
  type NewArticle,
  replayedArticle,
} from './article-setup.server.ts'
import { createFakeDrive, type FakeDrive } from './fake-drive.server.ts'
import { createDriveFolders } from './folders.server.ts'
import { createIssue } from './issue-setup.server.ts'

const TOKEN: DriveAccessToken = { accessToken: 'test-access-token', expiresAt: now(), ok: true }
const TEMPLATE = 'fake-template'
const TEREZA = { email: 'tereza.vlkova@external.test', name: 'Tereza Vlková' }
const ONDREJ = { email: 'ondrej.benes@external.test', name: 'Ondřej Beneš' }

type Harness = {
  app: TestApp
  articlesFolder: string
  drive: FakeDrive
  linkKey: string
  sent: MailMessage[]
  setup: ArticleSetup
}

async function withHarness(
  run: (harness: Harness) => Promise<void>,
  options: { mailPerDay?: number; mailer?: Mailer; token?: DriveAccessToken } = {},
): Promise<void> {
  let app = await createTestApp()
  try {
    let drive = createFakeDrive()
    drive.seedTemplate(TEMPLATE, 'Šablona článku')
    let issues = createIssueStore(app.database)
    let created = await createIssue(
      {
        folders: (accessToken) => createDriveFolders({ accessToken, fetch: drive.fetch }),
        issuesFolderId: TEST_ISSUES_FOLDER,
        now,
        store: issues,
        token: async () => TOKEN,
      },
      'VDM_2026_5',
      { displayName: 'Marie Horáková', email: 'marie@vednemesicnik.test' },
    )
    if (created.kind !== 'created') throw new Error('No issue.')
    let links = createLinkStore(app.database)
    let link = await links.articleLinkOf(created.issue.id)
    if (link === null) throw new Error('No link.')

    let sent: MailMessage[] = []
    let setup: ArticleSetup = {
      articles: createArticleStore(app.database),
      files: (accessToken) => createArticleFiles({ accessToken, fetch: drive.fetch }),
      folders: (accessToken) => createDriveFolders({ accessToken, fetch: drive.fetch }),
      issues,
      links,
      mailLog: createPublicMailLog(app.database),
      mailPerDay: options.mailPerDay ?? 300,
      mailer:
        options.mailer ??
        (async (message) => {
          sent.push(message)
          return { ok: true }
        }),
      now,
      origin: 'https://publikace.vednemesicnik.test',
      templateId: TEMPLATE,
      token: async () => options.token ?? TOKEN,
    }
    await run({
      app,
      articlesFolder: created.issue.folderIds.articles ?? '',
      drive,
      linkKey: link.key,
      sent,
      setup,
    })
  } finally {
    await app.close()
  }
}

function article(linkKey: string, overrides: Partial<NewArticle> = {}): NewArticle {
  return {
    authors: [TEREZA, ONDREJ],
    formKey: 'form-1',
    linkKey,
    name: 'Školní jídelna po roce',
    ...overrides,
  }
}

/** The files a test left on the fake drive, without the issue's folders and the template. */
function articleFiles(drive: FakeDrive) {
  return drive
    .files()
    .filter((file) => file.appProperties['publikaceAttempt'] !== undefined)
    .map((file) => ({ isTrashed: file.isTrashed, name: file.name }))
}

describe('creating an article (20c, 20d)', () => {
  it('makes the folder, the Doc with its name and _meta.json, then mails every author', () =>
    withHarness(async ({ articlesFolder, drive, linkKey, sent, setup }) => {
      let outcome = await createArticle(setup, article(linkKey))

      assert.equal(outcome.kind, 'created')
      if (outcome.kind !== 'created') return
      let folder = drive.files().find((file) => file.id === outcome.article.folderId)
      let doc = drive.files().find((file) => file.id === outcome.article.docId)
      let meta = drive.files().find((file) => file.name === '_meta.json')
      assert.equal(folder?.parentId, articlesFolder)
      assert.equal(folder?.name, 'Školní jídelna po roce')
      assert.equal(doc?.copiedFrom, TEMPLATE)
      assert.equal(doc?.parentId, folder?.id)
      assert.deepEqual(doc?.replacements, [
        { text: '{{NAZEV_CLANKU}}', with: 'Školní jídelna po roce' },
      ])
      assert.equal(meta?.parentId, folder?.id)
      assert.equal(JSON.parse(meta?.content ?? '{}').docId, doc?.id)

      assert.deepEqual(
        sent.map((message) => message.to),
        [TEREZA.email, ONDREJ.email],
      )
      assert.match(sent[0]?.htmlBody ?? '', /Na článku se také podílí Ondřej Beneš\./)
      assert.match(sent[0]?.htmlBody ?? '', /\/l\/[A-Za-z0-9]{12}\/artworks/)
      assert.equal(outcome.isEveryWelcomeSent, true)
    }))

  it('answers a second send of the same form with the first article, sending nothing again', () =>
    withHarness(async ({ drive, linkKey, sent, setup }) => {
      let [first, second] = await Promise.all([
        createArticle(setup, article(linkKey)),
        createArticle(setup, article(linkKey)),
      ])

      assert.equal(first.kind, 'created')
      assert.equal(second.kind, 'created')
      if (first.kind !== 'created' || second.kind !== 'created') return
      assert.equal(second.article.id, first.article.id)
      assert.equal(articleFiles(drive).length, 3)
      assert.equal(sent.length, 2)
    }))

  for (let step of ['folder', 'copy', 'replace', 'upload'] as const) {
    it(`puts everything in the bin when the ${step} step fails, and a new send succeeds`, () =>
      withHarness(async ({ drive, linkKey, setup }) => {
        drive.failStep(step)
        let failed = await createArticle(setup, article(linkKey))

        assert.equal(failed.kind, 'unavailable')
        assert.ok(articleFiles(drive).every((file) => file.isTrashed))
        assert.equal(await setup.articles.findByFormKey('form-1'), null)

        drive.heal()
        let again = await createArticle(setup, article(linkKey))
        assert.equal(again.kind, 'created')
      }))
  }

  it('finds a file whose reply was lost by its key, and puts it in the bin', () =>
    withHarness(async ({ drive, linkKey, setup }) => {
      drive.loseReplyOnStep('copy')
      let outcome = await createArticle(setup, article(linkKey))

      assert.equal(outcome.kind, 'unavailable')
      let files = articleFiles(drive)
      assert.deepEqual(files.map((file) => file.name).sort(), [
        'Školní jídelna po roce',
        'Školní jídelna po roce',
      ])
      assert.ok(files.every((file) => file.isTrashed))
    }))

  it('keeps the attempt to clean up later when the bin does not answer, and cleans it then', () =>
    withHarness(async ({ drive, linkKey, setup }) => {
      drive.failStep('upload')
      drive.failStep('trash')
      let outcome = await createArticle(setup, article(linkKey))

      assert.equal(outcome.kind, 'unavailable')
      assert.equal((await setup.articles.pendingCleanups()).length, 1)
      assert.ok(articleFiles(drive).some((file) => !file.isTrashed))

      drive.heal()
      let next = await createArticle(setup, article(linkKey, { formKey: 'form-2' }))
      assert.equal(next.kind, 'created')
      assert.equal((await setup.articles.pendingCleanups()).length, 0)
      assert.equal(articleFiles(drive).filter((file) => file.isTrashed).length, 2)
    }))

  it('cleans up at startup whatever a crash left uncommitted', () =>
    withHarness(async ({ linkKey, setup }) => {
      let link = await setup.links.findByKey(linkKey)
      if (link === null) return
      await setup.articles.startAttempt({
        at: now(),
        authors: [TEREZA],
        formKey: 'crashed',
        issueId: link.issueId,
        linkId: link.id,
        name: 'Článek',
      })

      await cleanUpAbandoned(setup)

      assert.equal(await setup.articles.findByFormKey('crashed'), null)
    }))

  it('marks a crash’s attempt at startup without the account, so the next send cleans it', () =>
    withHarness(async ({ linkKey, setup }) => {
      let link = await setup.links.findByKey(linkKey)
      if (link === null) return
      await setup.articles.startAttempt({
        at: now(),
        authors: [TEREZA],
        formKey: 'crashed',
        issueId: link.issueId,
        linkId: link.id,
        name: 'Článek',
      })

      await cleanUpAbandoned({
        ...setup,
        token: async () => ({ ok: false, reason: 'disconnected' }),
      })
      assert.equal((await setup.articles.pendingCleanups()).length, 1)

      assert.equal((await createArticle(setup, article(linkKey))).kind, 'created')
      assert.equal(await setup.articles.findByFormKey('crashed'), null)
    }))

  it('cleans up when storing the attempt throws, leaving no row behind', () =>
    withHarness(async ({ drive, linkKey, setup }) => {
      let failing: ArticleSetup = {
        ...setup,
        articles: {
          ...setup.articles,
          commit: async () => {
            throw new Error('database is locked')
          },
        },
      }
      let outcome = await createArticle(failing, article(linkKey))

      assert.equal(outcome.kind, 'unavailable')
      assert.equal(await setup.articles.findByFormKey('form-1'), null)
      assert.ok(articleFiles(drive).every((file) => file.isTrashed))
    }))

  it('lets only one of three sends in parallel past the last place under the limit', () =>
    withHarness(async ({ linkKey, setup }) => {
      let link = await setup.links.findByKey(linkKey)
      if (link === null) return
      for (let index = 0; index < 29; index++) {
        await setup.articles.startAttempt({
          at: now(),
          authors: [TEREZA],
          formKey: `earlier-${index}`,
          issueId: link.issueId,
          linkId: link.id,
          name: 'Článek',
        })
      }

      let outcomes = await Promise.all(
        ['form-a', 'form-b', 'form-c'].map((formKey) =>
          createArticle(setup, article(linkKey, { formKey })),
        ),
      )

      assert.deepEqual(outcomes.map((outcome) => outcome.kind).sort(), [
        'created',
        'limited',
        'limited',
      ])
    }))

  it('answers a resend through the replaced link with its article, and no other link at all', () =>
    withHarness(async ({ linkKey, setup }) => {
      assert.equal((await createArticle(setup, article(linkKey))).kind, 'created')
      let link = await setup.links.findByKey(linkKey)
      if (link === null) return
      let renewed = await setup.links.renew(link.issueId, now())

      assert.equal((await replayedArticle(setup, 'form-1', linkKey))?.kind, 'created')
      assert.equal(await replayedArticle(setup, 'form-1', renewed.key), null)
      assert.equal((await createArticle(setup, article(renewed.key))).kind, 'unavailable')
    }))

  it('says the issue’s Články folder is gone, and creates nothing', () =>
    withHarness(async ({ articlesFolder, drive, linkKey, setup }) => {
      drive.trash(articlesFolder)
      let outcome = await createArticle(setup, article(linkKey))

      assert.equal(outcome.kind, 'folder-gone')
      assert.deepEqual(articleFiles(drive), [])
    }))

  it('refuses a link replaced since the form was opened', () =>
    withHarness(async ({ linkKey, setup }) => {
      let link = await setup.links.findByKey(linkKey)
      if (link === null) return
      await setup.links.renew(link.issueId, now())

      assert.equal((await createArticle(setup, article(linkKey))).kind, 'link-gone')
    }))

  it('stops at thirty attempts an hour from one link', () =>
    withHarness(async ({ linkKey, setup }) => {
      let link = await setup.links.findByKey(linkKey)
      if (link === null) return
      for (let index = 0; index < 30; index++) {
        await setup.articles.startAttempt({
          at: now(),
          authors: [TEREZA],
          formKey: `earlier-${index}`,
          issueId: link.issueId,
          linkId: link.id,
          name: 'Článek',
        })
      }

      assert.equal((await createArticle(setup, article(linkKey))).kind, 'limited')
    }))

  it('creates nothing when the welcome e-mails would pass the cap of the day, and counts them', () =>
    withHarness(
      async ({ drive, linkKey, sent, setup }) => {
        assert.equal((await createArticle(setup, article(linkKey))).kind, 'created')
        assert.equal(sent.length, 2)
        let next = await createArticle(setup, article(linkKey, { formKey: 'form-2' }))
        assert.equal(next.kind, 'daily-cap')
        assert.equal(sent.length, 2)
        assert.equal(articleFiles(drive).filter((file) => !file.isTrashed).length, 3)
      },
      { mailPerDay: 3 },
    ))

  it('says why nothing was attempted while the account is not connected', () =>
    withHarness(
      async ({ drive, linkKey, setup }) => {
        assert.equal((await createArticle(setup, article(linkKey))).kind, 'disconnected')
        assert.deepEqual(articleFiles(drive), [])
      },
      { token: { ok: false, reason: 'disconnected' } },
    ))

  it('keeps the article when a welcome e-mail fails, and records it on the author', () =>
    withHarness(
      async ({ linkKey, setup }) => {
        let outcome = await createArticle(setup, article(linkKey))

        assert.equal(outcome.kind, 'created')
        if (outcome.kind !== 'created') return
        assert.equal(outcome.isEveryWelcomeSent, false)
        let [tereza, ondrej] = outcome.article.authors
        assert.ok(tereza?.welcomeSentAt !== null)
        assert.ok(ondrej?.welcomeFailedAt !== null)
      },
      {
        mailer: async (message) =>
          message.to === ONDREJ.email ? { error: 'server_error', ok: false } : { ok: true },
      },
    ))
})
