#!/usr/bin/env tsx
// One-time backfill: move in-DB image blobs to the on-disk image store.
//
// For every image row that still has a legacy `blob` but no `version`, this
// regenerates the full variant matrix (via the same `storeImageVariants` used by
// the upload path), writes the files to `IMAGE_STORE_PATH`, and fills the row's
// store metadata (`version`, `intrinsicWidth`, `intrinsicHeight`,
// `placeholderDataUrl`). It then regenerates each article's `pageSEO.ogImageUrl`
// to the new versioned URL shape and derives the OG crop for featured images.
//
// Idempotent: rows that already have a `version` are skipped, and the store is
// content-addressed by (id, version) so re-running overwrites identical files.
// The legacy `blob`/`contentType` columns are intentionally left untouched — they
// are dropped in a later migration only after this backfill has been verified.
//
// Run with: pnpm tsx ./scripts/migrate-images-to-store.ts

// dotenv must load before importing the image store, which reads
// IMAGE_STORE_PATH at module-eval time.
import 'dotenv/config'

import { PrismaClient } from '@generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

import { buildOgImageUrl } from '~/utils/image-store/image-url'
import type { StoredImageMeta } from '~/utils/image-store/store-image.server'
import {
  ensureOgImage,
  storeImageVariants,
} from '~/utils/image-store/store-image.server'

// Dedicated client (no per-query logging) so the migration output stays readable.
const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL }),
})

// One image model to backfill. Each closure is spelled out per-model to keep
// Prisma's delegate types intact (the delegates are structurally different).
type ImageModel = {
  label: string
  findPendingIds: () => Promise<Array<{ id: string }>>
  loadBlob: (id: string) => Promise<{ blob: Uint8Array | null } | null>
  saveMeta: (id: string, meta: StoredImageMeta) => Promise<unknown>
}

const IMAGE_MODELS: ImageModel[] = [
  {
    findPendingIds: () =>
      prisma.articleImage.findMany({
        select: { id: true },
        where: { blob: { not: null }, version: null },
      }),
    label: 'ArticleImage',
    loadBlob: (id) =>
      prisma.articleImage.findUnique({ select: { blob: true }, where: { id } }),
    saveMeta: (id, meta) =>
      prisma.articleImage.update({ data: meta, where: { id } }),
  },
  {
    findPendingIds: () =>
      prisma.issueCover.findMany({
        select: { id: true },
        where: { blob: { not: null }, version: null },
      }),
    label: 'IssueCover',
    loadBlob: (id) =>
      prisma.issueCover.findUnique({ select: { blob: true }, where: { id } }),
    saveMeta: (id, meta) =>
      prisma.issueCover.update({ data: meta, where: { id } }),
  },
  {
    findPendingIds: () =>
      prisma.podcastCover.findMany({
        select: { id: true },
        where: { blob: { not: null }, version: null },
      }),
    label: 'PodcastCover',
    loadBlob: (id) =>
      prisma.podcastCover.findUnique({ select: { blob: true }, where: { id } }),
    saveMeta: (id, meta) =>
      prisma.podcastCover.update({ data: meta, where: { id } }),
  },
  {
    findPendingIds: () =>
      prisma.podcastEpisodeCover.findMany({
        select: { id: true },
        where: { blob: { not: null }, version: null },
      }),
    label: 'PodcastEpisodeCover',
    loadBlob: (id) =>
      prisma.podcastEpisodeCover.findUnique({
        select: { blob: true },
        where: { id },
      }),
    saveMeta: (id, meta) =>
      prisma.podcastEpisodeCover.update({ data: meta, where: { id } }),
  },
  {
    findPendingIds: () =>
      prisma.userImage.findMany({
        select: { id: true },
        where: { blob: { not: null }, version: null },
      }),
    label: 'UserImage',
    loadBlob: (id) =>
      prisma.userImage.findUnique({ select: { blob: true }, where: { id } }),
    saveMeta: (id, meta) =>
      prisma.userImage.update({ data: meta, where: { id } }),
  },
]

// Backfill one model. Blobs are loaded one row at a time (not all at once) to keep
// peak memory low on the constrained production machine.
async function backfillModel(model: ImageModel) {
  const pending = await model.findPendingIds()
  if (pending.length === 0) {
    console.log(`  ${model.label}: nothing to backfill`)
    return
  }

  console.log(`  ${model.label}: ${pending.length} row(s) to backfill`)

  let done = 0
  for (const { id } of pending) {
    const row = await model.loadBlob(id)
    if (!row?.blob) {
      console.warn(`    ${model.label} ${id}: blob missing, skipping`)
      continue
    }

    const meta = await storeImageVariants(id, row.blob)
    await model.saveMeta(id, meta)

    done += 1
    console.log(
      `    ${model.label} ${id} → ${meta.version} (${done}/${pending.length})`,
    )
  }
}

// Extract the article-image id from either the legacy `?width=` URL shape or the
// new `/<version>/og.jpeg` shape.
const ARTICLE_IMAGE_ID_RE = /\/resources\/article-image\/([^/?]+)/

// Regenerate og:image/twitter:image URLs on every PageSEO row to the new versioned
// URL shape, deriving the OG crop on the way. Keying off the existing ogImageUrl
// (rather than the article→slug join) also fixes orphaned SEO rows whose article
// slug has since changed, and is idempotent for rows already migrated.
async function regenerateArticleOgImages() {
  const rows = await prisma.pageSEO.findMany({
    select: { id: true, ogImageUrl: true, pathname: true },
    where: { ogImageUrl: { not: null } },
  })

  console.log(`  ${rows.length} PageSEO row(s) with an OG image`)

  for (const row of rows) {
    const imageId = row.ogImageUrl?.match(ARTICLE_IMAGE_ID_RE)?.[1]
    if (!imageId) {
      console.warn(`    ${row.pathname}: unrecognised OG URL, skipping`)
      continue
    }

    const image = await prisma.articleImage.findUnique({
      select: { intrinsicWidth: true, version: true },
      where: { id: imageId },
    })

    // The referenced image row is gone (e.g. a deleted article's leftover SEO
    // row) — clear the now-broken legacy URL instead of leaving it dangling.
    if (!image) {
      await prisma.pageSEO.update({
        data: { ogImageUrl: null, twitterImageUrl: null },
        where: { id: row.id },
      })
      console.warn(`    ${row.pathname}: image ${imageId} gone, cleared OG URL`)
      continue
    }

    if (!image.version || image.intrinsicWidth === null) {
      console.warn(
        `    ${row.pathname}: referenced image ${imageId} not backfilled, skipping`,
      )
      continue
    }

    await ensureOgImage(imageId, image.version, image.intrinsicWidth)

    const ogImageUrl = buildOgImageUrl('article-image', imageId, image.version)

    await prisma.pageSEO.update({
      data: { ogImageUrl, twitterImageUrl: ogImageUrl },
      where: { id: row.id },
    })

    console.log(`    ${row.pathname} → ${ogImageUrl}`)
  }
}

async function main() {
  console.log('📦 Backfilling image variants to the store…')
  for (const model of IMAGE_MODELS) {
    await backfillModel(model)
  }

  console.log('🖼️  Regenerating article OG images…')
  await regenerateArticleOgImages()

  console.log('✅ Image store backfill complete')
}

main()
  .catch((error) => {
    console.error('❌ Image store backfill failed:', error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
