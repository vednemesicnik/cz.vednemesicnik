import { createHash, randomUUID } from 'node:crypto'

import type { ArticleStore } from '../data/articles.server.ts'
import type { GroupStore } from '../data/artwork-groups.server.ts'
import {
  type ArtworkRow,
  type ArtworkStore,
  type BatchRow,
  type HolderRef,
  HolderRemovedError,
} from '../data/artworks.server.ts'
import type { IssueStore } from '../data/issues.server.ts'
import type { LinkStore } from '../data/links.server.ts'
import type { PublicMailLog } from '../data/public-mail.server.ts'
import {
  canDiscardBatch,
  type HolderKind,
  type HolderName,
  imageTypeOf,
  isRequestSent,
  RECIPIENTS_PER_DAY_PER_LINK,
  SUBMITS_PER_HOUR,
  UNSENT_UPLOAD_HOURS,
  UPLOADS_PER_HOUR_PER_LINK,
} from '../domain/artwork.ts'
import type { ArticleFolderKind } from '../domain/article-folders.ts'
import type { Issue } from '../domain/issue.ts'
import type { Link } from '../domain/link.ts'
import { linkState } from '../domain/link.ts'
import { ARTWORK_TYPES, claimedType, MAX_FILE_BYTES } from '../domain/public/artwork-form.ts'
import { consentEmail, licenceAttachment } from '../mail/consent-email.server.ts'
import { isPermanentRefusal, type MailAttachment, type Mailer } from '../mail/mailer.server.ts'
import type { DriveAccessToken } from './access-token.server.ts'
import { type ArticleFoldersDeps, checkArticleFolders } from './article-folders.server.ts'
import type { ArtworkFiles, Bytes } from './artwork-files.server.ts'
import type { DriveFolders } from './folders.server.ts'
import { licenceDocName, licenceHtml, PREVIEW_SIZE } from './licence.server.ts'
import { logDriveFailure } from './log.server.ts'
import { createLock } from './one-at-a-time.server.ts'

/**
 * The artworks sent through an article's or an artwork group's link (`21a`–`21d`), and what the
 * editors-in-chief do with a batch (`12a`, `12o`). Both are a _holder_ here: a folder with
 * `Obrazová díla` and `Licence` inside, which a link uploads to (#133).
 *
 * A file is stored on Drive the moment it is chosen, in the holder's `Obrazová díla`, tagged with
 * its own upload key, and belongs to the page that uploaded it until a batch takes it; one never
 * sent goes to the bin 24 hours later. A batch's licences and their temporary Docs go to
 * `Licence`. Nothing happens while one of the holder's three folders is missing (`12j`).
 *
 * _Odeslat díla_ is all or nothing, as every action but the issue is (`11c`): the batch's row
 * comes first, each licence's IDs are stored the moment Drive returns them, and when a step fails
 * every licence and temporary Doc of the attempt goes to the bin, found by the stored IDs and by
 * the form key on each, and the artworks go back to their page.
 *
 * The consent request goes after the batch is committed. A batch whose request the Mailer did not
 * confirm stays committed and is _Chyba_ (`01b`): the page and the editors resend it with the same
 * idempotency key under the batch's own lock, so whichever succeeds first sends it once.
 */

export type ArtworksSetup = {
  articles: ArticleStore
  artworks: ArtworkStore
  files(accessToken: string): ArtworkFiles
  folders(accessToken: string): DriveFolders
  groups: GroupStore
  issues: IssueStore
  links: LinkStore
  mailLog: PublicMailLog
  /** The e-mails public pages and resends may start in a day: `PUBLIC_MAIL_PER_DAY`. */
  mailPerDay: number
  mailer: Mailer
  now(): Temporal.Instant
  token(): Promise<DriveAccessToken>
}

/**
 * What a batch or an upload belongs to, as far as Drive and the words go: an article or an
 * artwork group, its folder and the two inside it. A group has a note for the designer; an
 * article's is empty.
 */
export type ArtworksHolder = HolderName & {
  artworksFolderId: string | null
  createdAt: Temporal.Instant | null
  folderId: string | null
  id: number
  issueId: number
  kind: HolderKind
  licencesFolderId: string | null
  note: string
  /** When the article (`12z`) or the group (`12f`) was removed. */
  removedAt: Temporal.Instant | null
}

/** A committed holder with its folder and the two inside it, which a link may upload to. */
export type ReadyHolder = ArtworksHolder & {
  artworksFolderId: string
  folderId: string
  licencesFolderId: string
}

/** What a link of artworks answers through: the link, its issue and its committed holder. */
export type ArtworksTarget = {
  holder: ReadyHolder
  issue: Issue
  link: Link
}

/** The article or the group an upload, a batch or a link belongs to, `null` once it is gone. */
export async function holderOf(
  setup: Pick<ArtworksSetup, 'articles' | 'groups'>,
  ref: { articleId: number | null; groupId: number | null },
): Promise<ArtworksHolder | null> {
  if (ref.groupId !== null) {
    let group = await setup.groups.findById(ref.groupId)
    return group === null ? null : { ...group, kind: 'group' }
  }
  if (ref.articleId === null) return null
  let article = await setup.articles.findById(ref.articleId)
  return article === null ? null : { ...article, kind: 'article', note: '' }
}

/** What the store takes for the holder: its ID under the kind's own column. */
function refOf(holder: Pick<ArtworksHolder, 'id' | 'kind'>): HolderRef {
  return holder.kind === 'group'
    ? { articleId: null, groupId: holder.id }
    : { articleId: holder.id, groupId: null }
}

function folderDeps(setup: ArtworksSetup, accessToken: string): ArticleFoldersDeps {
  return {
    articles: setup.articles,
    folders: setup.folders(accessToken),
    groups: setup.groups,
    now: setup.now,
  }
}

/** `folder-gone` when any of the three is missing, which the check records on the holder. */
async function foldersOf(
  setup: ArtworksSetup,
  accessToken: string,
  holder: ArtworksHolder,
  which?: readonly ArticleFolderKind[],
): Promise<'folder-gone' | 'present' | 'unavailable'> {
  let check = await checkArticleFolders(folderDeps(setup, accessToken), holder, which)
  if (check === 'unavailable') return 'unavailable'
  return check.missing.length > 0 ? 'folder-gone' : 'present'
}

const lock = createLock()

/**
 * The key a batch's licences and temporary Docs carry on Drive. Its own namespace, never the form
 * key as the page sent it: the article's own files carry the article page's form key, and a
 * cleanup by a key somebody chose must not be able to reach them.
 */
function licenceKey(formKey: string): string {
  return `artworks:${formKey}`
}

/** Uploads under way per link, which the cap counts before their rows exist. */
const uploading = new Map<number, number>()

/*
 * Bodies read at once, in the whole app. Each holds up to 15 MB in memory until Drive has it, and
 * the cap per link would let sixty run together; past this many, an upload waits its turn.
 */
const BODIES_AT_ONCE = 4
let bodiesReading = 0
let waitingForBody: (() => void)[] = []

async function withBodySlot<T>(run: () => Promise<T>): Promise<T> {
  if (bodiesReading >= BODIES_AT_ONCE) {
    await new Promise<void>((resolve) => waitingForBody.push(resolve))
  }
  bodiesReading += 1
  try {
    return await run()
  } finally {
    bodiesReading -= 1
    waitingForBody.shift()?.()
  }
}

/**
 * The link, when it is a valid link of artworks to a committed article or group with its two
 * folders; `null` otherwise. An article without them exists only in databases from before the
 * folders, and is no target.
 */
export async function resolveArtworksLink(
  setup: Pick<ArtworksSetup, 'articles' | 'groups' | 'issues' | 'links'>,
  key: string,
): Promise<ArtworksTarget | null> {
  let link = await setup.links.findByKey(key)
  if (link === null || link.kind !== 'artworks') return null
  let issue = await setup.issues.findById(link.issueId)
  let holder = await holderOf(setup, link)
  if (linkState(link, issue, holder) !== 'valid' || issue === null) return null
  if (
    holder === null ||
    holder.createdAt === null ||
    holder.folderId === null ||
    holder.artworksFolderId === null ||
    holder.licencesFolderId === null
  ) {
    return null
  }
  return {
    holder: {
      ...holder,
      artworksFolderId: holder.artworksFolderId,
      folderId: holder.folderId,
      licencesFolderId: holder.licencesFolderId,
    },
    issue,
    link,
  }
}

/* ─── The upload ─────────────────────────────────────────────────────────────────────────── */

export type NewUpload = {
  /** What the browser claimed the file is; trusted only to name a file that is no image. */
  declaredType: string
  fileName: string
  formKey: string
  linkKey: string
  /** Reads the body: `too-large` past what an artwork may be, `cut` when it stopped coming. */
  readBody(): Promise<Bytes | 'cut' | 'too-large'>
}

export type UploadOutcome =
  | { artwork: ArtworkRow; kind: 'unreadable' | 'uploaded' }
  | { kind: 'disconnected' | 'not-connected' }
  | { kind: 'folder-gone' }
  | { kind: 'limited' }
  | { kind: 'link-gone' }
  | { kind: 'too-large' }
  | { kind: 'unavailable' }

export async function uploadArtwork(
  setup: ArtworksSetup,
  upload: NewUpload,
): Promise<UploadOutcome> {
  let target = await resolveArtworksLink(setup, upload.linkKey)
  if (target === null) return { kind: 'link-gone' }
  let { holder, link } = target

  let token = await setup.token()
  if (!token.ok) return { kind: token.reason }
  let files = setup.files(token.accessToken)
  await sweepExpired(setup, files)

  let folders = await foldersOf(setup, token.accessToken, holder)
  if (folders !== 'present') return { kind: folders }

  /* The count and the reservation in one step per link, before the body is read, so uploads in
     parallel cannot all pass the cap and a refused one costs nothing. */
  let since = setup.now().subtract({ minutes: 60 })
  let isReserved = await lock(`link:${link.id}`, async () => {
    let inFlight = uploading.get(link.id) ?? 0
    if (
      (await setup.artworks.uploadsSince(link.id, since)) + inFlight >=
      UPLOADS_PER_HOUR_PER_LINK
    ) {
      return false
    }
    uploading.set(link.id, inFlight + 1)
    return true
  })
  if (!isReserved) return { kind: 'limited' }

  try {
    return await withBodySlot(() => store(setup, files, upload, target))
  } finally {
    uploading.set(link.id, (uploading.get(link.id) ?? 1) - 1)
  }
}

async function store(
  setup: ArtworksSetup,
  files: ArtworkFiles,
  upload: NewUpload,
  { holder, link }: ArtworksTarget,
): Promise<UploadOutcome> {
  let bytes = await upload.readBody()
  if (bytes === 'cut') return { kind: 'unavailable' }
  if (bytes === 'too-large' || bytes.byteLength > MAX_FILE_BYTES) return { kind: 'too-large' }
  if (bytes.byteLength === 0) return { kind: 'unavailable' }

  let type = imageTypeOf(bytes)
  let claimed = claimedType({ name: upload.fileName, type: upload.declaredType })
  let mimeType = type ?? claimed ?? 'application/octet-stream'
  let extension = ARTWORK_TYPES[mimeType] ?? '.bin'
  let storedName = `${createHash('sha256').update(bytes).digest('hex')}${extension}`
  let uploadKey = randomUUID()

  let stored = await files.upload(holder.artworksFolderId, storedName, mimeType, bytes, uploadKey)
  if (!stored.ok) {
    /* A reply lost on the way back leaves a file only its key finds. */
    let lost = await files.findTagged(holder.artworksFolderId, uploadKey)
    if (lost === null) logDriveFailure('an upload whose reply was lost was not found', uploadKey)
    for (let id of lost ?? []) await files.trash(id)
    return { kind: 'unavailable' }
  }
  let artwork: ArtworkRow
  try {
    artwork = await setup.artworks.addUpload({
      ...refOf(holder),
      at: setup.now(),
      driveFileId: stored.id,
      formKey: upload.formKey,
      isReadable: type !== null,
      linkId: link.id,
      mimeType,
      originalName: upload.fileName,
      size: bytes.byteLength,
      storedName,
      uploadKey,
    })
  } catch (error) {
    /* A file no row knows of would stay in the folder for good: it goes to the bin at once. */
    logDriveFailure(
      'an upload was not recorded',
      error instanceof Error ? error.message : 'unknown error',
    )
    await files.trash(stored.id)
    return { kind: 'unavailable' }
  }
  return { artwork, kind: type === null ? 'unreadable' : 'uploaded' }
}

/* ─── _Odebrat_, _Zrušit_ ────────────────────────────────────────────────────────────────── */

/**
 * Takes an unsent upload off its page and puts its file in the bin, but only while the file is
 * still in `Obrazová díla`: a file somebody moved is theirs. When Drive does not answer, the
 * row stays unsent, so the 24-hour sweep tries again.
 */
export async function removeArtwork(
  setup: ArtworksSetup,
  removal: { artworkId: number; formKey: string; linkKey: string },
): Promise<'link-gone' | 'removed' | 'unavailable'> {
  let target = await resolveArtworksLink(setup, removal.linkKey)
  if (target === null) return 'link-gone'
  return lock(`artworks:${removal.formKey}`, async () => {
    let artwork = await setup.artworks.findUpload(removal.artworkId)
    if (
      artwork === null ||
      artwork.formKey !== removal.formKey ||
      artwork.linkId !== target.link.id ||
      artwork.batchId !== null ||
      artwork.removedAt !== null
    ) {
      return 'removed'
    }
    let token = await setup.token()
    if (!token.ok) return 'unavailable'
    let isGone = await trashIfInFolder(
      setup.files(token.accessToken),
      artwork.driveFileId,
      target.holder.artworksFolderId,
    )
    if (!isGone) return 'unavailable'
    await setup.artworks.markRemoved(artwork.id, setup.now())
    return 'removed'
  })
}

/** `true` when the file is in the bin or no longer the app's to put there. */
async function trashIfInFolder(
  files: ArtworkFiles,
  fileId: string,
  folderId: string,
): Promise<boolean> {
  let place = await files.placeOf(fileId)
  if (place.kind === 'unavailable') return false
  if (place.kind === 'gone' || !place.parents.includes(folderId)) return true
  return files.trash(fileId)
}

/** The uploads that waited 24 hours unsent go to the bin, one sweep at a time. */
async function sweepExpired(setup: ArtworksSetup, files: ArtworkFiles): Promise<void> {
  await lock.ifFree('artworks:sweep', async () => {
    let before = setup.now().subtract({ hours: UNSENT_UPLOAD_HOURS })
    for (let artwork of await setup.artworks.expiredUploads(before)) {
      let holder = await holderOf(setup, artwork)
      await lock.ifFree(`artworks:${artwork.formKey}`, async () => {
        /* Read again under the page's key: a send may have taken it into a batch meanwhile. */
        let current = await setup.artworks.findUpload(artwork.id)
        if (current === null || current.batchId !== null || current.removedAt !== null) return
        let isGone =
          holder?.artworksFolderId == null
            ? true
            : await trashIfInFolder(files, artwork.driveFileId, holder.artworksFolderId)
        if (isGone) await setup.artworks.markRemoved(artwork.id, setup.now())
      })
    }
  })
}

/* ─── _Odeslat díla_ ─────────────────────────────────────────────────────────────────────── */

export type NewBatch = {
  artworks: readonly { author: string; id: number; source: string }[]
  /** The form's one-time key: a second send with it gets the first one's answer. */
  formKey: string
  linkKey: string
  provider: { email: string; name: string }
}

export type SentBatch = { batch: BatchRow; holder: HolderName }

export type SubmitOutcome =
  | ({ kind: 'sent' } & SentBatch)
  | ({ kind: 'refused' } & SentBatch)
  | { kind: 'daily-cap' }
  | { kind: 'disconnected' | 'not-connected' }
  | { kind: 'discarded' }
  | { kind: 'folder-gone' }
  | { kind: 'limited' }
  | { kind: 'link-gone' }
  | { kind: 'recipients' }
  /* A card the page sent that is no longer one of its unsent uploads. */
  | { kind: 'stale' }
  | { kind: 'unavailable' }

export function submitArtworks(setup: ArtworksSetup, input: NewBatch): Promise<SubmitOutcome> {
  return lock(`artworks:${input.formKey}`, () => submit(setup, input))
}

async function submit(setup: ArtworksSetup, input: NewBatch): Promise<SubmitOutcome> {
  let link = await setup.links.findByKey(input.linkKey)
  let existing = await setup.artworks.findBatchByFormKey(input.formKey)
  if (existing !== null && existing.linkId !== link?.id) return { kind: 'unavailable' }
  if (existing !== null && existing.createdAt !== null) return replay(setup, existing)

  let target = await resolveArtworksLink(setup, input.linkKey)
  if (target === null) return { kind: 'link-gone' }
  let { holder, issue } = target

  let token = await setup.token()
  if (!token.ok) return { kind: token.reason }
  let files = setup.files(token.accessToken)

  await cleanUpPending(setup, files, input.formKey)
  /* This form's own earlier attempt is still waiting for its licences to reach the bin. */
  if ((await setup.artworks.findBatchByFormKey(input.formKey)) !== null)
    return { kind: 'unavailable' }

  /* Every card must be an upload of this page, readable and not yet sent. */
  let unsent = new Set(
    (await setup.artworks.unsentByForm(input.formKey))
      .filter((artwork) => artwork.isReadable && artwork.linkId === target.link.id)
      .map((artwork) => artwork.id),
  )
  if (!input.artworks.every((artwork) => unsent.has(artwork.id))) return { kind: 'stale' }

  let folders = await foldersOf(setup, token.accessToken, holder)
  if (folders !== 'present') return { kind: folders }

  /* The limits and the row in one step per link, so sends in parallel cannot all pass them. */
  let started = await lock(`link:${target.link.id}`, async () => {
    let at = setup.now()
    if (
      (await setup.artworks.recentBatches(target.link.id, at.subtract({ minutes: 60 }))) >=
      SUBMITS_PER_HOUR
    ) {
      return { kind: 'limited' as const }
    }
    let recipients = await setup.artworks.recipientsSince(
      target.link.id,
      at.subtract({ hours: 24 }),
    )
    let email = input.provider.email.toLowerCase()
    if (!recipients.includes(email) && recipients.length >= RECIPIENTS_PER_DAY_PER_LINK) {
      return { kind: 'recipients' as const }
    }
    if (!(await reservePublicMail(setup, 'consent', 1))) return { kind: 'daily-cap' as const }
    try {
      let { batch } = await setup.artworks.startBatch({
        ...refOf(holder),
        artworks: input.artworks,
        at,
        formKey: input.formKey,
        issueId: issue.id,
        linkId: target.link.id,
        provider: input.provider,
      })
      return { batch, kind: 'started' as const }
    } catch (error) {
      if (error instanceof HolderRemovedError) return { kind: 'link-gone' as const }
      logDriveFailure(
        'an artwork batch was not started',
        error instanceof Error ? error.message : 'unknown error',
      )
      return { kind: 'unavailable' as const }
    }
  })
  if (started.kind !== 'started') return started

  let pdfs: Map<number, Bytes> | null = null
  let committed: BatchRow | null = null
  try {
    pdfs = await makeLicences(setup, files, started.batch, holder.licencesFolderId)
    if (pdfs !== null) committed = await setup.artworks.commitBatch(started.batch.id, setup.now())
  } catch (error) {
    logDriveFailure(
      'an artwork batch was not created',
      error instanceof Error ? error.message : 'unknown error',
    )
  }
  if (committed === null || pdfs === null) {
    await cleanUp(setup, files, started.batch, holder.licencesFolderId)
    let after = await foldersOf(setup, token.accessToken, holder)
    return { kind: after === 'folder-gone' ? 'folder-gone' : 'unavailable' }
  }

  let attachments = committed.artworks.map((artwork) =>
    licenceAttachment(artwork.licenceHash ?? '', pdfs.get(artwork.id) ?? new Uint8Array()),
  )
  return sendRequest(setup, committed, holder, issue.name, attachments)
}

/** A second send of a committed batch: its answer, or its request retried once more. */
async function replay(setup: ArtworksSetup, batch: BatchRow): Promise<SubmitOutcome> {
  let found = await holderOf(setup, batch)
  let holder: HolderName = {
    kind: found?.kind ?? (batch.groupId === null ? 'article' : 'group'),
    name: found?.name ?? '',
  }
  if (batch.discardedAt !== null) return { kind: 'discarded' }
  if (batch.mailSentAt !== null) return { batch, holder, kind: 'sent' }
  if (batch.mailRefusedAt !== null) return { batch, holder, kind: 'refused' }
  let resent = await resendRequest(setup, batch)
  if (resent.kind === 'sent') return { batch: resent.batch, holder, kind: 'sent' }
  if (resent.kind === 'refused') return { batch: resent.batch, holder, kind: 'refused' }
  if (resent.kind === 'daily-cap') return { kind: 'daily-cap' }
  return { kind: 'unavailable' }
}

/**
 * The licence of each artwork, its IDs stored the moment Drive returns them: the HTML as a
 * temporary Doc, its PDF stored as `<sha256>.pdf`, the Doc to the bin. The PDFs come back by
 * artwork for the request's attachments; `null` is a step that failed.
 */
async function makeLicences(
  setup: ArtworksSetup,
  files: ArtworkFiles,
  batch: BatchRow,
  folderId: string,
): Promise<Map<number, Bytes> | null> {
  let pdfs = new Map<number, Bytes>()
  for (let artwork of batch.artworks) {
    let preview = await files.previewOf(artwork.driveFileId, PREVIEW_SIZE)
    let html = licenceHtml({
      author: artwork.author,
      preview,
      providerEmail: batch.providerEmail,
      providerName: batch.providerName,
      source: artwork.source,
      storedName: artwork.storedName,
    })
    let doc = await files.importHtmlAsDoc(
      folderId,
      licenceDocName(artwork.storedName),
      html,
      licenceKey(batch.formKey),
    )
    if (!doc.ok) return null
    await setup.artworks.setLicenceDoc(artwork.id, doc.id)

    let pdf = await files.exportPdf(doc.id)
    if (pdf === null) return null
    let hash = createHash('sha256').update(pdf).digest('hex')
    let stored = await files.upload(
      folderId,
      `${hash}.pdf`,
      'application/pdf',
      pdf,
      licenceKey(batch.formKey),
    )
    if (!stored.ok) return null
    await setup.artworks.setLicenceFile(artwork.id, stored.id, hash)
    pdfs.set(artwork.id, pdf)

    /* The temporary Doc's work is done. One that does not reach the bin is no failure of the
       batch: the PDF exists, and the Doc carries the form key for whoever finds it. */
    if (!(await files.trash(doc.id))) {
      logDriveFailure('a temporary licence Doc was not moved to the bin', doc.id)
    }
  }
  return pdfs
}

/**
 * Puts every licence and temporary Doc of a failed attempt in the bin and gives the artworks back
 * to their page. The stored IDs cover what Drive answered; the form key on each file covers a
 * reply lost on the way back. The artworks themselves stay: they are the page's, not the
 * attempt's. When Drive does not answer even this, the batch stays marked and is tried again.
 */
async function cleanUp(
  setup: ArtworksSetup,
  files: ArtworkFiles,
  batch: BatchRow,
  folderId: string | null,
): Promise<boolean> {
  let current = (await setup.artworks.findBatch(batch.id)) ?? batch
  let ids = new Set(
    current.artworks
      .flatMap((artwork) => [artwork.licenceDocId, artwork.licenceFileId])
      .filter((id): id is string => id !== null),
  )
  let isComplete = true
  if (folderId !== null) {
    let tagged = await files.findTagged(folderId, licenceKey(current.formKey))
    if (tagged === null) isComplete = false
    else for (let id of tagged) ids.add(id)
  }
  for (let id of ids) {
    if (!(await files.trash(id))) isComplete = false
  }
  if (isComplete) await setup.artworks.discardAttempt(current.id)
  else await setup.artworks.markForCleanup(current.id, setup.now())
  return isComplete
}

/** The attempts whose cleanup failed before; another form's only while its key is free. */
async function cleanUpPending(
  setup: ArtworksSetup,
  files: ArtworkFiles,
  ownFormKey: string | null,
): Promise<void> {
  for (let batch of await setup.artworks.pendingCleanups()) {
    if (batch.formKey === ownFormKey) await cleanUpMarked(setup, files, batch)
    else await lock.ifFree(`artworks:${batch.formKey}`, () => cleanUpMarked(setup, files, batch))
  }
}

async function cleanUpMarked(
  setup: ArtworksSetup,
  files: ArtworkFiles,
  batch: BatchRow,
): Promise<void> {
  let current = await setup.artworks.findBatchByFormKey(batch.formKey)
  if (
    current === null ||
    current.id !== batch.id ||
    current.createdAt !== null ||
    current.cleanupAt === null
  ) {
    return
  }
  let holder = await holderOf(setup, current)
  await cleanUp(setup, files, current, holder?.licencesFolderId ?? null)
}

/**
 * At startup, before the port opens: every uncommitted batch is one a crash or a failed cleanup
 * left behind, and every upload older than 24 hours waited unsent. Each attempt is marked first,
 * so without a connected account, or with Drive down, the next send cleans it up.
 */
export async function cleanUpAbandonedArtworks(setup: ArtworksSetup): Promise<void> {
  let abandoned = await setup.artworks.abandonedBatches()
  for (let batch of abandoned) {
    if (batch.cleanupAt === null) await setup.artworks.markForCleanup(batch.id, setup.now())
  }
  let token = await setup.token()
  if (!token.ok) return
  let files = setup.files(token.accessToken)
  await cleanUpPending(setup, files, null)
  await sweepExpired(setup, files)
}

/* ─── The consent request ────────────────────────────────────────────────────────────────── */

/**
 * Takes `count` places under the cap of today, Prague's day, before anything is made, so sends in
 * parallel cannot all pass the same count; `false` when they do not fit.
 */
export function reservePublicMail(
  setup: Pick<ArtworksSetup, 'mailLog' | 'mailPerDay' | 'now'>,
  kind: 'consent' | 'welcome',
  count: number,
): Promise<boolean> {
  let at = setup.now()
  let since = at.toZonedDateTimeISO('Europe/Prague').startOfDay().toInstant()
  return setup.mailLog.reserve(kind, count, { cap: setup.mailPerDay, since }, at)
}

async function sendRequest(
  setup: ArtworksSetup,
  batch: BatchRow,
  holder: HolderName,
  issueName: string,
  attachments: MailAttachment[],
): Promise<SubmitOutcome> {
  let named: HolderName = { kind: holder.kind, name: holder.name }
  /* Before the Mailer: a request it never confirmed may still have gone under this name. */
  await setup.artworks.recordRequestName(batch.id, named.name)
  let result = await setup.mailer(
    consentEmail({
      artworks: batch.artworks.map((artwork) => ({
        author: artwork.author,
        pdfHash: artwork.licenceHash ?? '',
        source: artwork.source,
        storedName: artwork.storedName,
      })),
      attachments,
      formKey: batch.formKey,
      holder: named,
      issueName,
      tag: batch.tag,
      to: batch.providerEmail,
    }),
  )
  let outcome: 'failed' | 'refused' | 'sent' = result.ok
    ? 'sent'
    : isPermanentRefusal(result)
      ? 'refused'
      : 'failed'
  await setup.artworks.markMail(batch.id, outcome, setup.now())
  let current = (await setup.artworks.findBatch(batch.id)) ?? batch
  if (outcome === 'sent') return { batch: current, holder: named, kind: 'sent' }
  if (outcome === 'refused') return { batch: current, holder: named, kind: 'refused' }
  return { kind: 'unavailable' }
}

export type ResendOutcome =
  | { batch: BatchRow; kind: 'refused' | 'sent' }
  | {
      kind:
        | 'already-sent'
        | 'closed'
        | 'daily-cap'
        | 'folder-gone'
        | 'gone'
        | 'pdf-gone'
        | 'unavailable'
    }
  | { kind: 'disconnected' | 'not-connected' }

/**
 * _Poslat žádost znovu_ (`12o`): the same request again, the same address, subject, tag and
 * PDFs, read back from Drive. Called with the batch's lock held.
 */
async function resendRequest(setup: ArtworksSetup, batch: BatchRow): Promise<ResendOutcome> {
  let current = await setup.artworks.findBatch(batch.id)
  if (current === null || current.createdAt === null || current.discardedAt !== null)
    return { kind: 'gone' }
  if (current.mailSentAt !== null) return { kind: 'already-sent' }
  let issue = await setup.issues.findById(current.issueId)
  let holder = await holderOf(setup, current)
  if (issue === null || holder === null) return { kind: 'gone' }
  if (issue.closedAt !== null) return { kind: 'closed' }

  let token = await setup.token()
  if (!token.ok) return { kind: token.reason }
  /* The PDFs are in `Licence`: the folders come first, so a missing one is named as a folder
     and not as a PDF of the batch (`12o`). */
  let check = await checkArticleFolders(folderDeps(setup, token.accessToken), holder, [
    'article',
    'licences',
  ])
  if (check === 'unavailable') return { kind: 'unavailable' }
  if (check.missing.length > 0) return { kind: 'folder-gone' }
  let files = setup.files(token.accessToken)
  let attachments: MailAttachment[] = []
  for (let artwork of current.artworks) {
    /* A PDF in the bin still reads, so where it is is asked first: a request must not attach
       what the editors cannot see on Drive. */
    if (artwork.licenceFileId === null) return { kind: 'pdf-gone' }
    let place = await files.placeOf(artwork.licenceFileId)
    if (place.kind === 'unavailable') return { kind: 'unavailable' }
    if (place.kind === 'gone') return { kind: 'pdf-gone' }
    let bytes = await files.read(artwork.licenceFileId)
    if (bytes === null) return { kind: 'unavailable' }
    attachments.push(licenceAttachment(artwork.licenceHash ?? '', bytes))
  }
  if (!(await reservePublicMail(setup, 'consent', 1))) return { kind: 'daily-cap' }

  let sent = await sendRequest(setup, current, holder, issue.name, attachments)
  if (sent.kind === 'sent' || sent.kind === 'refused') return { batch: sent.batch, kind: sent.kind }
  return { kind: 'unavailable' }
}

/** The editors' resend, under the batch's lock, so it and the open page never both send. */
export async function resendBatch(setup: ArtworksSetup, batchId: number): Promise<ResendOutcome> {
  let batch = await setup.artworks.findBatch(batchId)
  if (batch === null) return { kind: 'gone' }
  return lock(`artworks:${batch.formKey}`, () => resendRequest(setup, batch))
}

export type DiscardOutcome =
  | { batch: BatchRow; kind: 'discarded' }
  | { kind: 'already-sent' | 'approved' | 'closed' | 'gone' | 'verified' }
  /**
   * The batch is still there but no longer one to discard: discarded in another tab, or turned
   * into an error of its archive while the dialog was open. The table says which.
   */
  | { kind: 'not-discardable' }
  | { kind: 'disconnected' | 'not-connected' }
  | { kind: 'folder-gone'; missing: ArticleFolderKind[] }
  /** `isPartlyBinned`: Drive refused to take back a file this attempt had put in the bin. */
  | { isPartlyBinned: boolean; kind: 'unavailable' }

/**
 * _Zahodit dávku_ (`12o`): the batch's artworks and PDFs to the shared drive's bin, a file a
 * person moved out of `Obrazová díla` or `Licence` left alone, and the batch kept as a record.
 * Nothing is deleted for good.
 *
 * All or nothing (`11c`): where every file is gets asked before any goes, and when Drive stops
 * midway, what this attempt put in the bin comes back out and nothing is marked. A file Drive
 * would not take back stays in the bin, logged; the next discard counts it as done. An approval
 * or a consent recorded with _Je to souhlas_ can come at any moment while the request is out, and
 * the mark is what decides: one that came first takes the files back out too (`12o`).
 *
 * `wasSent` is what the dialog showed. One opened before the request went did not say that it
 * cannot be taken back, so a request sent meanwhile sends the editor back to the table.
 */
export async function discardBatch(
  setup: ArtworksSetup,
  batchId: number,
  wasSent: boolean,
): Promise<DiscardOutcome> {
  let batch = await setup.artworks.findBatch(batchId)
  if (batch === null) return { kind: 'gone' }
  return lock(`artworks:${batch.formKey}`, async () => {
    let current = await setup.artworks.findBatch(batchId)
    if (current === null || current.createdAt === null) return { kind: 'gone' }
    if (current.discardedAt !== null) return { kind: 'not-discardable' }
    let issue = await setup.issues.findById(current.issueId)
    let holder = await holderOf(setup, current)
    if (issue === null || holder?.folderId == null) return { kind: 'gone' }
    if (issue.closedAt !== null) return { kind: 'closed' }
    if (current.approvedAt !== null) return { kind: 'approved' }
    if (current.consentVerifiedAt !== null) return { kind: 'verified' }
    if (!wasSent && isRequestSent(current)) return { kind: 'already-sent' }
    if (!canDiscardBatch(current)) return { kind: 'not-discardable' }

    let token = await setup.token()
    if (!token.ok) {
      if (token.reason === 'unavailable') return { isPartlyBinned: false, kind: 'unavailable' }
      return { kind: token.reason }
    }
    /* A file in a folder that is in the bin would come back with the folder, as a file of a
       batch the app holds discarded: nothing goes while one of the three is missing (`12o`). */
    let check = await checkArticleFolders(folderDeps(setup, token.accessToken), holder)
    if (check === 'unavailable') return { isPartlyBinned: false, kind: 'unavailable' }
    if (check.missing.length > 0) return { kind: 'folder-gone', missing: check.missing }
    let { artworksFolderId, licencesFolderId } = holder
    if (artworksFolderId === null || licencesFolderId === null) return { kind: 'gone' }
    let files = setup.files(token.accessToken)
    let placed = current.artworks.flatMap((artwork) =>
      [
        { folderId: artworksFolderId, id: artwork.driveFileId },
        { folderId: licencesFolderId, id: artwork.licenceFileId },
        { folderId: licencesFolderId, id: artwork.licenceDocId },
      ].filter((file): file is { folderId: string; id: string } => file.id !== null),
    )
    let ours: string[] = []
    for (let file of placed) {
      let place = await files.placeOf(file.id)
      if (place.kind === 'unavailable') return { isPartlyBinned: false, kind: 'unavailable' }
      if (place.kind === 'here' && place.parents.includes(file.folderId)) ours.push(file.id)
    }
    let tried: string[] = []
    let restore = async () => {
      let isPartlyBinned = false
      for (let back of tried) {
        if (!(await files.restore(back))) isPartlyBinned = true
      }
      return isPartlyBinned
    }
    for (let id of ours) {
      /* Tried before it is trashed: a reply Drive lost leaves the file in the bin as well, and
         taking back one that never went changes nothing. */
      tried.push(id)
      if (await files.trash(id)) continue
      return { isPartlyBinned: await restore(), kind: 'unavailable' }
    }
    let marked = await setup.artworks.discardBatch(current.id, setup.now())
    if (marked === 'discarded') return { batch: current, kind: 'discarded' }
    if (await restore()) {
      logDriveFailure('a discarded batch was not restored', 'Drive refused to take a file back')
    }
    return { kind: marked === 'gone' ? 'not-discardable' : marked }
  })
}
