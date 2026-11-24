import * as assert from 'remix/assert'
import { sql } from 'remix/data-table'
import { describe, it } from 'remix/test'

import { createArticleStore } from '../data/articles.server.ts'
import { createGroupStore } from '../data/artwork-groups.server.ts'
import { createArtworkStore } from '../data/artworks.server.ts'
import { createIssueStore } from '../data/issues.server.ts'
import { createLinkStore } from '../data/links.server.ts'
import { createPublicMailLog } from '../data/public-mail.server.ts'
import { UPLOADS_PER_HOUR_PER_LINK } from '../domain/artwork.ts'
import type { MailMessage, MailResult } from '../mail/mailer.server.ts'
import { createTestApp, seedArticle, seedIssue, type TestApp } from '../test-app.server.ts'
import type { DriveAccessToken } from './access-token.server.ts'
import { createArtworkFiles } from './artwork-files.server.ts'
import {
  type ArtworksSetup,
  cleanUpAbandonedArtworks,
  discardBatch,
  type NewBatch,
  removeArtwork,
  resendBatch,
  resolveArtworksLink,
  submitArtworks,
  uploadArtwork,
} from './artworks-setup.server.ts'
import type { FakeDrive } from './fake-drive.server.ts'
import { createDriveFolders } from './folders.server.ts'

const START = Temporal.Instant.from('2026-11-18T12:45:00Z')
const TOKEN: DriveAccessToken = { accessToken: 'test-access-token', expiresAt: START, ok: true }
const ONDREJ = { email: 'ondrej.benes@external.test', name: 'Ondřej Beneš' }
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4])
const PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46, 1, 2])

type Harness = {
  app: TestApp
  clock: { at: Temporal.Instant }
  artworksFolderId: string
  drive: FakeDrive
  folderId: string
  licencesFolderId: string
  linkKey: string
  mail: MailMessage[]
  /** Whether the Mailer answers `server_error`, for a test that switches it. */
  mailer: { isFailing: boolean }
  setup: ArtworksSetup
  upload(formKey: string, bytes?: Uint8Array, name?: string): ReturnType<typeof uploadArtwork>
}

async function withHarness(
  run: (harness: Harness) => Promise<void>,
  options: { answer?: () => MailResult; isMailFailing?: boolean; mailPerDay?: number } = {},
): Promise<void> {
  let app = await createTestApp()
  try {
    let issueId = await seedIssue(app, 'VDM_2026_5')
    let { artworksFolderId, folderId, licencesFolderId, link } = await seedArticle(app, issueId)
    let clock = { at: START }
    let mail: MailMessage[] = []
    let mailer = { isFailing: options.isMailFailing ?? false }
    let setup: ArtworksSetup = {
      articles: createArticleStore(app.database),
      artworks: createArtworkStore(app.database),
      files: (accessToken) => createArtworkFiles({ accessToken, fetch: app.drive.fetch }),
      folders: (accessToken) => createDriveFolders({ accessToken, fetch: app.drive.fetch }),
      groups: createGroupStore(app.database),
      issues: createIssueStore(app.database),
      links: createLinkStore(app.database),
      mailLog: createPublicMailLog(app.database),
      mailPerDay: options.mailPerDay ?? 300,
      mailer: async (message) => {
        mail.push(message)
        if (mailer.isFailing) return { error: 'server_error', ok: false }
        return options.answer?.() ?? { ok: true }
      },
      now: () => clock.at,
      token: async () => TOKEN,
    }
    let upload = (formKey: string, bytes: Uint8Array = JPEG, name = 'jidelna-1.jpg') =>
      uploadArtwork(setup, {
        declaredType: 'image/jpeg',
        fileName: name,
        formKey,
        linkKey: link.key,
        readBody: async () => new Uint8Array(bytes),
      })
    await run({
      app,
      artworksFolderId,
      clock,
      drive: app.drive,
      folderId,
      licencesFolderId,
      linkKey: link.key,
      mail,
      mailer,
      setup,
      upload,
    })
  } finally {
    await app.close()
  }
}

const FORM = '11111111-1111-4111-8111-111111111111'

async function uploaded(harness: Harness, formKey = FORM, name?: string): Promise<number> {
  let outcome = await harness.upload(formKey, JPEG, name)
  if (outcome.kind !== 'uploaded') throw new Error(`Not uploaded: ${outcome.kind}`)
  return outcome.artwork.id
}

function batch(linkKey: string, ids: number[], overrides: Partial<NewBatch> = {}): NewBatch {
  return {
    artworks: ids.map((id, index) => ({
      author: index === 0 ? '' : 'Ondřej Beneš',
      id,
      source: index === 0 ? 'https://unsplash.com/photos/jidelna-a8Kq' : '',
    })),
    formKey: FORM,
    linkKey,
    provider: ONDREJ,
    ...overrides,
  }
}

/** A batch of two artworks in _Chyba_, its e-mail unconfirmed. */
async function twoArtworkBatch(harness: Harness) {
  let ids = [await uploaded(harness), await uploaded(harness, FORM, 'jidelna-2.jpg')]
  await submitArtworks(harness.setup, batch(harness.linkKey, ids))
  let stored = await harness.setup.artworks.findBatchByFormKey(FORM)
  if (stored === null) throw new Error('No batch')
  return stored
}

/** The batch's artworks and PDFs that are in the bin, in the batch's order. */
function binned(drive: FakeDrive, stored: { artworks: readonly ArtworkFileIds[] }): string[] {
  let trashed = new Set(
    drive
      .files()
      .filter((file) => file.isTrashed)
      .map((file) => file.id),
  )
  return stored.artworks
    .flatMap((artwork) => [artwork.driveFileId, artwork.licenceFileId])
    .filter((id): id is string => id !== null && trashed.has(id))
}

type ArtworkFileIds = { driveFileId: string; licenceFileId: string | null }

function live(drive: FakeDrive) {
  return drive
    .files()
    .filter((file) => !file.isTrashed && file.appProperties['publikaceAttempt'] !== undefined)
}

describe('uploading an artwork', () => {
  it('stores the file at once in Obrazová díla, named by its fingerprint and tagged', () =>
    withHarness(async (harness) => {
      let outcome = await harness.upload(FORM)
      assert.equal(outcome.kind, 'uploaded')
      let [file] = live(harness.drive)
      assert.equal(file?.parentId, harness.artworksFolderId)
      assert.match(file?.name ?? '', /^[0-9a-f]{64}\.jpg$/)
      assert.equal(file?.mimeType, 'image/jpeg')
      assert.deepEqual([...(file?.bytes ?? [])], [...JPEG])
    }))

  it('keeps a file that is no image as a failed card, stored and counted', () =>
    withHarness(async (harness) => {
      let outcome = await harness.upload(FORM, new Uint8Array([1, 2, 3, 4]), 'obalka.heic')
      assert.equal(outcome.kind, 'unreadable')
      assert.equal(live(harness.drive).length, 1)
    }))

  it('refuses the sixty-first upload of an hour before reading its body', () =>
    withHarness(async ({ clock, linkKey, setup }) => {
      let link = await setup.links.findByKey(linkKey)
      let article = link?.articleId ?? 0
      for (let index = 0; index < UPLOADS_PER_HOUR_PER_LINK; index += 1) {
        await setup.artworks.addUpload({
          articleId: article,
          at: clock.at.subtract({ minutes: 30 }),
          driveFileId: `seeded-${index}`,
          formKey: 'other',
          isReadable: true,
          linkId: link?.id ?? 0,
          mimeType: 'image/jpeg',
          originalName: 'x.jpg',
          size: 1,
          storedName: 'x.jpg',
          uploadKey: `seeded-${index}`,
        })
      }
      let isRead = false
      let outcome = await uploadArtwork(setup, {
        declaredType: 'image/jpeg',
        fileName: 'a.jpg',
        formKey: FORM,
        linkKey,
        readBody: async () => {
          isRead = true
          return new Uint8Array(JPEG)
        },
      })
      assert.equal(outcome.kind, 'limited')
      assert.equal(isRead, false)
      clock.at = clock.at.add({ minutes: 31 })
      assert.equal(
        (
          await uploadArtwork(setup, {
            declaredType: 'image/jpeg',
            fileName: 'a.jpg',
            formKey: FORM,
            linkKey,
            readBody: async () => new Uint8Array(JPEG),
          })
        ).kind,
        'uploaded',
      )
    }))

  it('refuses a body over 15 MB, a link of another kind, and a gone folder', () =>
    withHarness(async (harness) => {
      let tooLarge = await uploadArtwork(harness.setup, {
        declaredType: 'image/jpeg',
        fileName: 'ples.tif',
        formKey: FORM,
        linkKey: harness.linkKey,
        readBody: async () => 'too-large' as const,
      })
      assert.equal(tooLarge.kind, 'too-large')

      let articleLink = await harness.setup.links.articleLinkOf(1)
      let wrongKind = await uploadArtwork(harness.setup, {
        declaredType: 'image/jpeg',
        fileName: 'a.jpg',
        formKey: FORM,
        linkKey: articleLink?.key ?? '',
        readBody: async () => new Uint8Array(JPEG),
      })
      assert.equal(wrongKind.kind, 'link-gone')

      harness.drive.trash(harness.folderId)
      assert.equal((await harness.upload(FORM)).kind, 'folder-gone')
    }))

  it('puts a removed upload in the bin, but leaves a file somebody moved', () =>
    withHarness(async (harness) => {
      let first = await uploaded(harness)
      let second = await uploaded(harness, FORM, 'jidelna-2.jpg')
      let [, moved] = live(harness.drive)
      harness.drive.move(moved?.id ?? '', 'somewhere-else')

      let remove = (artworkId: number) =>
        removeArtwork(harness.setup, { artworkId, formKey: FORM, linkKey: harness.linkKey })
      assert.equal(await remove(first), 'removed')
      assert.equal(await remove(second), 'removed')

      assert.deepEqual(
        harness.drive
          .files()
          .filter((file) => file.isTrashed)
          .map((file) => file.parentId),
        [harness.artworksFolderId],
      )
      assert.deepEqual(await harness.setup.artworks.unsentByForm(FORM), [])
    }))

  it('leaves an old upload alone once a send took it into a batch', () =>
    withHarness(async (harness) => {
      let id = await uploaded(harness)
      harness.clock.at = harness.clock.at.add({ hours: 25 })
      assert.equal((await submitArtworks(harness.setup, batch(harness.linkKey, [id]))).kind, 'sent')
      await uploaded(harness, 'cccccccc-1111-4111-8111-111111111111')
      let trashed = harness.drive.files().filter((file) => file.isTrashed)
      assert.ok(trashed.every((file) => file.mimeType !== 'image/jpeg'))
    }))

  it('puts an upload that waited 24 hours unsent in the bin on the next upload', () =>
    withHarness(async (harness) => {
      await uploaded(harness, 'aaaaaaaa-1111-4111-8111-111111111111')
      harness.clock.at = harness.clock.at.add({ hours: 25 })
      await uploaded(harness)
      assert.equal(harness.drive.files().filter((file) => file.isTrashed).length, 1)
    }))
})

describe('sending a batch', () => {
  it('makes a licence PDF per artwork, commits the batch, then mails the provider once', () =>
    withHarness(async (harness) => {
      let ids = [await uploaded(harness), await uploaded(harness, FORM, 'IMG_4471.heic')]
      let outcome = await submitArtworks(harness.setup, batch(harness.linkKey, ids))
      assert.equal(outcome.kind, 'sent')

      let pdfs = live(harness.drive).filter((file) => file.mimeType === 'application/pdf')
      assert.equal(pdfs.length, 2)
      assert.ok(pdfs.every((file) => /^[0-9a-f]{64}\.pdf$/.test(file.name)))
      assert.ok(pdfs.every((file) => file.parentId === harness.licencesFolderId))
      let docs = harness.drive.files().filter((file) => file.name.startsWith('_tmp_licence_'))
      assert.ok(docs.length === 2 && docs.every((file) => file.isTrashed))
      assert.ok(docs.every((file) => file.parentId === harness.licencesFolderId))

      let [message] = harness.mail
      assert.equal(harness.mail.length, 1)
      assert.equal(message?.to, ONDREJ.email)
      assert.equal(
        message?.subject,
        'Žádost o potvrzení souhlasu s užitím obrazových děl ke článku „Školní jídelna po roce“ – VDM_2026_5 [20261118T134500]',
      )
      assert.equal(message?.idempotencyKey, `artwork-consent:${FORM}`)
      assert.deepEqual(
        message?.attachments?.map((attachment) => attachment.filename).sort(),
        pdfs.map((file) => file.name).sort(),
      )
      assert.ok(message?.htmlBody.includes('Autor: neuveden'))
      assert.ok(message?.htmlBody.includes('Zdroj: https://unsplash.com/photos/jidelna-a8Kq'))

      let again = await submitArtworks(harness.setup, batch(harness.linkKey, ids))
      assert.equal(again.kind, 'sent')
      assert.equal(harness.mail.length, 1)
    }))

  it('puts the attempt’s licences in the bin when Drive fails midway, keeping the uploads', () =>
    withHarness(async (harness) => {
      let ids = [await uploaded(harness), await uploaded(harness, FORM, 'b.jpg')]
      harness.drive.failStep('export')
      let outcome = await submitArtworks(harness.setup, batch(harness.linkKey, ids))
      assert.equal(outcome.kind, 'unavailable')
      assert.equal(harness.mail.length, 0)
      assert.equal(await harness.setup.artworks.findBatchByFormKey(FORM), null)
      assert.equal((await harness.setup.artworks.unsentByForm(FORM)).length, 2)
      assert.deepEqual(
        live(harness.drive).map((file) => file.mimeType),
        ['image/jpeg', 'image/jpeg'],
      )

      harness.drive.heal()
      assert.equal((await submitArtworks(harness.setup, batch(harness.linkKey, ids))).kind, 'sent')
    }))

  it('finds a licence PDF whose reply was lost by the form key, and puts it in the bin', () =>
    withHarness(async (harness) => {
      let ids = [await uploaded(harness)]
      harness.drive.loseReplyOnStep('store')
      assert.equal(
        (await submitArtworks(harness.setup, batch(harness.linkKey, ids))).kind,
        'unavailable',
      )
      assert.equal(
        live(harness.drive).filter((file) => file.mimeType === 'application/pdf').length,
        0,
      )
    }))

  it('keeps a batch whose request failed, and a resend sends only the request', () =>
    withHarness(
      async (harness) => {
        let ids = [await uploaded(harness)]
        assert.equal(
          (await submitArtworks(harness.setup, batch(harness.linkKey, ids))).kind,
          'unavailable',
        )
        let stored = await harness.setup.artworks.findBatchByFormKey(FORM)
        assert.ok(stored?.createdAt !== null && stored?.mailSentAt === null)
        let pdfCount = live(harness.drive).length

        harness.mailer.isFailing = false
        let outcome = await submitArtworks(harness.setup, batch(harness.linkKey, ids))
        assert.equal(outcome.kind, 'sent')
        assert.equal(harness.mail.length, 2)
        assert.equal(harness.mail[1]?.idempotencyKey, harness.mail[0]?.idempotencyKey)
        assert.equal(live(harness.drive).length, pdfCount)
      },
      { isMailFailing: true },
    ))

  it('tells a permanent refusal from a failure', () =>
    withHarness(
      async (harness) => {
        let ids = [await uploaded(harness)]
        let outcome = await submitArtworks(harness.setup, batch(harness.linkKey, ids))
        assert.equal(outcome.kind, 'refused')
        let resent = await submitArtworks(harness.setup, batch(harness.linkKey, ids))
        assert.equal(resent.kind, 'refused')
        assert.equal(harness.mail.length, 1)
      },
      { answer: () => ({ error: 'invalid_recipient', ok: false }) },
    ))

  it('stops at five addresses a day per link, letting one of them through', () =>
    withHarness(async (harness) => {
      for (let index = 0; index < 5; index += 1) {
        let formKey = `0000000${index}-1111-4111-8111-111111111111`
        let id = await uploaded(harness, formKey)
        let sent = await submitArtworks(
          harness.setup,
          batch(harness.linkKey, [id], {
            formKey,
            provider: { email: `poskytovatel${index}@external.test`, name: 'Poskytovatel' },
          }),
        )
        assert.equal(sent.kind, 'sent')
      }
      let id = await uploaded(harness)
      assert.equal(
        (await submitArtworks(harness.setup, batch(harness.linkKey, [id]))).kind,
        'recipients',
      )
      let known = await submitArtworks(
        harness.setup,
        batch(harness.linkKey, [id], {
          provider: { email: 'POSKYTOVATEL0@external.test', name: 'Poskytovatel' },
        }),
      )
      assert.equal(known.kind, 'sent')
    }))

  it('creates nothing past the cap of the day on e-mails', () =>
    withHarness(
      async (harness) => {
        await harness.setup.mailLog.record('welcome', 2, harness.clock.at)
        let ids = [await uploaded(harness)]
        assert.equal(
          (await submitArtworks(harness.setup, batch(harness.linkKey, ids))).kind,
          'daily-cap',
        )
        assert.equal(await harness.setup.artworks.findBatchByFormKey(FORM), null)
      },
      { mailPerDay: 2 },
    ))

  it('refuses an artwork that is not this page’s', () =>
    withHarness(async (harness) => {
      let other = await uploaded(harness, 'bbbbbbbb-1111-4111-8111-111111111111')
      assert.equal(
        (await submitArtworks(harness.setup, batch(harness.linkKey, [other]))).kind,
        'stale',
      )
    }))
})

describe('the editors’ actions on a batch', () => {
  it('resends a request the Mailer did not confirm, with the stored PDFs', () =>
    withHarness(
      async (harness) => {
        let ids = [await uploaded(harness)]
        await submitArtworks(harness.setup, batch(harness.linkKey, ids))
        let stored = await harness.setup.artworks.findBatchByFormKey(FORM)
        harness.mailer.isFailing = false
        let outcome = await resendBatch(harness.setup, stored?.id ?? 0)
        assert.equal(outcome.kind, 'sent')
        assert.equal(
          harness.mail[1]?.attachments?.[0]?.data,
          harness.mail[0]?.attachments?.[0]?.data,
        )
        assert.equal((await resendBatch(harness.setup, stored?.id ?? 0)).kind, 'already-sent')
      },
      { isMailFailing: true },
    ))

  it('says a PDF is in the bin rather than sending without it', () =>
    withHarness(
      async (harness) => {
        let ids = [await uploaded(harness)]
        await submitArtworks(harness.setup, batch(harness.linkKey, ids))
        let stored = await harness.setup.artworks.findBatchByFormKey(FORM)
        harness.drive.trash(stored?.artworks[0]?.licenceFileId ?? '')
        assert.equal((await resendBatch(harness.setup, stored?.id ?? 0)).kind, 'pdf-gone')
      },
      { isMailFailing: true },
    ))

  it('discards a batch to the bin and keeps it as a record; the page then asks for a new upload', () =>
    withHarness(
      async (harness) => {
        let ids = [await uploaded(harness)]
        await submitArtworks(harness.setup, batch(harness.linkKey, ids))
        let stored = await harness.setup.artworks.findBatchByFormKey(FORM)
        let outcome = await discardBatch(harness.setup, stored?.id ?? 0)
        assert.equal(outcome.kind, 'discarded')
        assert.equal(live(harness.drive).length, 0)
        assert.notEqual(
          (await harness.setup.artworks.findBatch(stored?.id ?? 0))?.discardedAt,
          null,
        )
        assert.equal(
          (await submitArtworks(harness.setup, batch(harness.linkKey, ids))).kind,
          'discarded',
        )
      },
      { isMailFailing: true },
    ))

  it('refuses to discard a batch whose request went meanwhile', () =>
    withHarness(async (harness) => {
      let ids = [await uploaded(harness)]
      await submitArtworks(harness.setup, batch(harness.linkKey, ids))
      let stored = await harness.setup.artworks.findBatchByFormKey(FORM)
      assert.equal((await discardBatch(harness.setup, stored?.id ?? 0)).kind, 'already-sent')
      assert.ok(live(harness.drive).length > 0)
    }))

  it('tags a batch’s licences apart from any form key, so a cleanup reaches only them', () =>
    withHarness(async (harness) => {
      let ids = [await uploaded(harness)]
      harness.drive.failStep('export')
      await submitArtworks(harness.setup, batch(harness.linkKey, ids))
      let trashed = harness.drive.files().filter((file) => file.isTrashed)
      assert.ok(trashed.length > 0)
      assert.ok(
        trashed.every((file) => file.appProperties['publikaceAttempt'] === `artworks:${FORM}`),
      )
    }))
})

describe('the cleanup at startup', () => {
  it('puts what a crash left uncommitted in the bin and gives the artworks back', () =>
    withHarness(async (harness) => {
      let id = await uploaded(harness)
      let link = await harness.setup.links.findByKey(harness.linkKey)
      let { batch: started } = await harness.setup.artworks.startBatch({
        articleId: link?.articleId ?? 0,
        artworks: [{ author: '', id, source: '' }],
        at: harness.clock.at,
        formKey: FORM,
        issueId: link?.issueId ?? 0,
        linkId: link?.id ?? 0,
        provider: ONDREJ,
      })
      let files = createArtworkFiles({ accessToken: 'x', fetch: harness.drive.fetch })
      let pdf = await files.upload(
        harness.licencesFolderId,
        'x.pdf',
        'application/pdf',
        new Uint8Array(PDF_BYTES),
        FORM,
      )
      if (pdf.ok) await harness.setup.artworks.setLicenceFile(id, pdf.id, 'hash')
      assert.equal(started.createdAt, null)

      await cleanUpAbandonedArtworks(harness.setup)

      assert.equal(await harness.setup.artworks.findBatchByFormKey(FORM), null)
      assert.equal(
        live(harness.drive).filter((file) => file.mimeType === 'application/pdf').length,
        0,
      )
      assert.equal((await harness.setup.artworks.unsentByForm(FORM)).length, 1)
    }))
})

describe('a missing folder of the article (12j)', () => {
  async function missingOf(harness: Harness) {
    let link = await harness.setup.links.findByKey(harness.linkKey)
    let article = await harness.setup.articles.findById(link?.articleId ?? 0)
    return article?.missing
  }

  it('refuses an upload while Licence is in the bin, records it, and lets one through once it is back', () =>
    withHarness(async (harness) => {
      harness.drive.trash(harness.licencesFolderId)
      assert.equal((await harness.upload(FORM)).kind, 'folder-gone')
      assert.deepEqual(await missingOf(harness), {
        article: null,
        artworks: null,
        licences: START,
      })

      harness.drive.restore(harness.licencesFolderId)
      assert.equal((await harness.upload(FORM)).kind, 'uploaded')
      assert.equal((await missingOf(harness))?.licences, null)
    }))

  it('names only the article folder when its folders are in the bin with it', () =>
    withHarness(async (harness) => {
      harness.drive.trash(harness.folderId)
      assert.equal((await harness.upload(FORM)).kind, 'folder-gone')
      assert.deepEqual(await missingOf(harness), {
        article: START,
        artworks: null,
        licences: null,
      })
    }))

  it('names Licence beside the article folder when somebody put it in the bin on its own', () =>
    withHarness(async (harness) => {
      harness.drive.trash(harness.licencesFolderId)
      harness.drive.trash(harness.folderId)
      assert.equal((await harness.upload(FORM)).kind, 'folder-gone')
      assert.deepEqual(await missingOf(harness), {
        article: START,
        artworks: null,
        licences: START,
      })
    }))

  it('refuses a send while Obrazová díla is missing, and creates nothing', () =>
    withHarness(async (harness) => {
      let ids = [await uploaded(harness)]
      harness.drive.remove(harness.artworksFolderId)
      let outcome = await submitArtworks(harness.setup, batch(harness.linkKey, ids))
      assert.equal(outcome.kind, 'folder-gone')
      assert.equal(harness.mail.length, 0)
      assert.equal(await harness.setup.artworks.findBatchByFormKey(FORM), null)
      assert.notEqual((await missingOf(harness))?.artworks, null)
    }))

  it('resends without Obrazová díla, but not without Licence', () =>
    withHarness(
      async (harness) => {
        let ids = [await uploaded(harness)]
        await submitArtworks(harness.setup, batch(harness.linkKey, ids))
        let stored = await harness.setup.artworks.findBatchByFormKey(FORM)

        harness.drive.trash(harness.licencesFolderId)
        assert.equal((await resendBatch(harness.setup, stored?.id ?? 0)).kind, 'folder-gone')
        assert.notEqual((await missingOf(harness))?.licences, null)
        harness.drive.restore(harness.licencesFolderId)

        harness.drive.trash(harness.artworksFolderId)
        harness.mailer.isFailing = false
        assert.equal((await resendBatch(harness.setup, stored?.id ?? 0)).kind, 'sent')
      },
      { isMailFailing: true },
    ))

  it('discards nothing while a folder of the batch is missing, and says which', () =>
    withHarness(
      async (harness) => {
        let ids = [await uploaded(harness)]
        await submitArtworks(harness.setup, batch(harness.linkKey, ids))
        let stored = await harness.setup.artworks.findBatchByFormKey(FORM)
        harness.drive.trash(harness.artworksFolderId)

        let outcome = await discardBatch(harness.setup, stored?.id ?? 0)
        assert.deepEqual(outcome, { kind: 'folder-gone', missing: ['artworks'] })
        let artwork = stored?.artworks[0]
        let kept = harness.drive
          .files()
          .filter((file) => file.id === artwork?.driveFileId || file.id === artwork?.licenceFileId)
        assert.ok(kept.length === 2 && kept.every((file) => !file.isTrashed))
        assert.equal((await harness.setup.artworks.findBatch(stored?.id ?? 0))?.discardedAt, null)
      },
      { isMailFailing: true },
    ))

  it('takes back out of the bin what a discard Drive stopped midway had put there', () =>
    withHarness(
      async (harness) => {
        let stored = await twoArtworkBatch(harness)
        harness.drive.failTrashOf(stored.artworks[1]?.driveFileId ?? '')

        assert.deepEqual(await discardBatch(harness.setup, stored.id), {
          isPartlyBinned: false,
          kind: 'unavailable',
        })
        assert.deepEqual(binned(harness.drive, stored), [])
        assert.equal((await harness.setup.artworks.findBatch(stored.id))?.discardedAt, null)

        harness.drive.heal()
        assert.equal((await discardBatch(harness.setup, stored.id)).kind, 'discarded')
        assert.equal(binned(harness.drive, stored).length, 4)
      },
      { isMailFailing: true },
    ))

  it('leaves a PDF a person had put in the bin there when a discard is taken back', () =>
    withHarness(
      async (harness) => {
        let stored = await twoArtworkBatch(harness)
        let pdf = stored.artworks[0]?.licenceFileId ?? ''
        harness.drive.trash(pdf)
        harness.drive.failTrashOf(stored.artworks[1]?.driveFileId ?? '')

        assert.equal((await discardBatch(harness.setup, stored.id)).kind, 'unavailable')
        assert.deepEqual(binned(harness.drive, stored), [pdf])
      },
      { isMailFailing: true },
    ))

  it('takes back a file whose move to the bin Drive did but never confirmed', () =>
    withHarness(
      async (harness) => {
        let stored = await twoArtworkBatch(harness)
        harness.drive.loseReplyOnStep('trash')

        assert.equal((await discardBatch(harness.setup, stored.id)).kind, 'unavailable')
        assert.deepEqual(binned(harness.drive, stored), [])
      },
      { isMailFailing: true },
    ))

  it('says so when Drive would not take back what the discard had put in the bin', () =>
    withHarness(
      async (harness) => {
        let stored = await twoArtworkBatch(harness)
        harness.drive.failTrashOf(stored.artworks[1]?.driveFileId ?? '')
        harness.drive.failRestore()

        assert.deepEqual(await discardBatch(harness.setup, stored.id), {
          isPartlyBinned: true,
          kind: 'unavailable',
        })
        assert.equal(binned(harness.drive, stored).length, 2)
        assert.equal((await harness.setup.artworks.findBatch(stored.id))?.discardedAt, null)

        harness.drive.heal()
        assert.equal((await discardBatch(harness.setup, stored.id)).kind, 'discarded')
        assert.equal(binned(harness.drive, stored).length, 4)
      },
      { isMailFailing: true },
    ))

  it('treats an article without its two folders as no target of its link', () =>
    withHarness(async (harness) => {
      await harness.app.database.exec(
        sql`UPDATE articles SET artworks_folder_id = NULL, licences_folder_id = NULL`,
      )
      assert.equal(await resolveArtworksLink(harness.setup, harness.linkKey), null)
      assert.equal((await harness.upload(FORM)).kind, 'link-gone')
    }))
})
