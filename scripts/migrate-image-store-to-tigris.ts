#!/usr/bin/env tsx
// One-off migration of the on-disk (volume) image store into a Tigris bucket.
//
// Preferred path is `aws s3 sync $IMAGE_STORE_PATH s3://$BUCKET_NAME/
// --endpoint-url $AWS_ENDPOINT_URL_S3` run from the app machine (fast, native,
// resumable; the endpoint is required to target Tigris rather than AWS S3). This
// script is the fallback for when
// the AWS CLI is not available in the container: it walks the volume directory and
// PUTs each variant file into the bucket under the same key (the relative path),
// skipping objects that already exist so it can be re-run safely.
//
// Run with:  tsx scripts/migrate-image-store-to-tigris.ts   (or: pnpm images:migrate:tigris)

import 'dotenv/config'

import { readdir, readFile, stat } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'

import { createTigrisImageStore } from '../app/utils/image-store/create-tigris-image-store'

const rootDir = process.env.IMAGE_STORE_PATH ?? './data/images'

// Content type from the variant file extension (avif or the jpeg fallback/OG crop).
const contentTypeFor = (path: string) =>
  path.endsWith('.avif') ? 'image/avif' : 'image/jpeg'

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
