#!/usr/bin/env tsx
// One-off migration of the on-disk (volume) image store into a Tigris bucket.
//
// It walks the volume directory and PUTs each variant file into the bucket under
// the same key (the relative path), skipping objects that already exist so it can
// be re-run safely.
//
// In production run the pre-bundled build from the app machine (no `tsx`/`app/`
// source needed in the image — see vite.migrate.config.ts):
//   pnpm images:migrate:tigris:built        # = node build/migrate-tigris.mjs
// Locally:
//   pnpm images:migrate:tigris              # = tsx scripts/migrate-image-store-to-tigris.ts
//
// Alternative if the `aws` CLI is available: `aws s3 sync $IMAGE_STORE_PATH
// s3://$BUCKET_NAME/ --endpoint-url $AWS_ENDPOINT_URL_S3` (the endpoint targets
// Tigris rather than AWS S3).

import 'dotenv/config'

import { readdir, readFile, stat } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'

import { createTigrisImageStore } from '../app/utils/image-store/create-tigris-image-store'

// Required, not defaulted: both real run contexts set it (Fly via the Dockerfile
// ENV, local via .env), and a migration tool should fail loudly rather than guess
// a path if it is somehow missing.
const rootDir = process.env.IMAGE_STORE_PATH

// Content type for the two variant extensions the store holds (avif + the jpeg
// fallback / OG crop). Anything else is filtered out before this is called.
const contentTypeFor = (key: string) =>
  key.endsWith('.avif') ? 'image/avif' : 'image/jpeg'

// The store only ever contains `.avif` and `.jpeg` variant files.
const isVariantFile = (key: string) =>
  key.endsWith('.avif') || key.endsWith('.jpeg')

// Yield every file path under `dir`, recursing into subdirectories.
async function* walk(dir: string): AsyncGenerator<string> {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      yield* walk(path)
    } else if (entry.isFile()) {
      yield path
    }
  }
}

async function main() {
  if (!rootDir) {
    console.error(
      'IMAGE_STORE_PATH is not set — point it at the image store root (e.g. /data/images on Fly, ./data/images locally).',
    )
    process.exit(1)
  }

  try {
    const stats = await stat(rootDir)
    if (!stats.isDirectory()) throw new Error('not a directory')
  } catch {
    console.error(`Image store path does not exist: ${rootDir}`)
    process.exit(1)
  }

  const store = createTigrisImageStore({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    bucket: process.env.BUCKET_NAME ?? '',
    endpoint: process.env.AWS_ENDPOINT_URL_S3 ?? '',
    region: process.env.AWS_REGION ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
  })

  let uploaded = 0
  let skipped = 0

  for await (const filePath of walk(rootDir)) {
    // Store key = path relative to the root, always forward-slashed.
    const key = relative(rootDir, filePath).split(sep).join('/')

    // Don't guess a Content-Type for stray non-variant files; surface and skip them.
    if (!isVariantFile(key)) {
      console.warn(`Skipping unexpected file (not an image variant): ${key}`)
      continue
    }

    if (await store.exists(key)) {
      skipped += 1
      continue
    }

    const data = await readFile(filePath)
    await store.put(key, data, contentTypeFor(key))
    uploaded += 1

    if ((uploaded + skipped) % 100 === 0) {
      console.log(`… ${uploaded} uploaded, ${skipped} skipped`)
    }
  }

  console.log(
    `Done. Uploaded ${uploaded} object(s), skipped ${skipped} already present.`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
