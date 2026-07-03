import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  type ObjectIdentifier,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'

import type { ImageStore } from './types'

// S3 caps a single DeleteObjects request at 1000 keys.
const DELETE_BATCH_SIZE = 1000

export type TigrisConfig = {
  endpoint: string
  region: string
  bucket: string
  accessKeyId: string
  secretAccessKey: string
  // Optional prefix prepended to every key, so this store occupies a namespace
  // inside a shared bucket (e.g. "images/") alongside other content (e.g.
  // "pdfs/"). Defaults to "" (keys at the bucket root). Callers pass unprefixed
  // keys; the prefix is applied at the S3 boundary and is otherwise invisible.
  keyPrefix?: string
}

// A key addresses a prefix (directory) rather than a single object when it ends
// in "/" or is empty. The empty key is the whole store — the volume driver wipes
// its root the same way (e.g. `imageStore.delete([''])` in prisma/seed.ts).
const isPrefixKey = (key: string) => key === '' || key.endsWith('/')

// Whether an S3 error means "no such object" (a real 404, not a transport error).
function isNotFound(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false
  const { name, $metadata } = error as {
    name?: string
    $metadata?: { httpStatusCode?: number }
  }
  return (
    name === 'NoSuchKey' ||
    name === 'NotFound' ||
    $metadata?.httpStatusCode === 404
  )
}

// Tigris-backed (S3-compatible) ImageStore: variants live as objects in a bucket
// instead of files on the Fly volume, so image durability and bandwidth are off
// the app machine's volume. Serving still streams through the app read path
// (resource routes), just from the bucket rather than local disk.
export const createTigrisImageStore = (config: TigrisConfig): ImageStore => {
  const {
    endpoint,
    region,
    bucket,
    accessKeyId,
    secretAccessKey,
    keyPrefix = '',
  } = config

  // Map a caller-facing key onto its actual object key in the bucket. Prefixing
  // the empty (whole-store) key yields the namespace prefix itself, so a store
  // reset wipes only this store's objects, not a sibling namespace's.
  const resolveKey = (key: string) => `${keyPrefix}${key}`

  // Fail loud and early: the Tigris driver is useless without full credentials,
  // and env validation leaves these optional (only required for this driver).
  const missing = (
    [
      ['AWS_ENDPOINT_URL_S3', endpoint],
      ['AWS_REGION', region],
      ['BUCKET_NAME', bucket],
      ['AWS_ACCESS_KEY_ID', accessKeyId],
      ['AWS_SECRET_ACCESS_KEY', secretAccessKey],
    ] as const
  )
    .filter(([, value]) => !value)
    .map(([name]) => name)

  if (missing.length > 0) {
    throw new Error(
      `Tigris image store is missing required configuration: ${missing.join(', ')}. ` +
        `Set these env vars or use IMAGE_STORE_DRIVER=volume.`,
    )
  }

  const client = new S3Client({
    credentials: { accessKeyId, secretAccessKey },
    endpoint,
    // Tigris uses virtual-host-style buckets by default, but path-style keeps the
    // custom endpoint working regardless of DNS setup.
    forcePathStyle: true,
    region,
  })

  // Remove every object under a prefix (mirrors the volume driver's `rm -r`).
  // Streamed page-by-page — list one page (capped at the DeleteObjects limit),
  // delete it, then continue — so memory stays bounded even for the whole-bucket
  // wipe (empty prefix), rather than buffering every key up front.
  const deletePrefix = async (prefix: string) => {
    let continuationToken: string | undefined

    do {
      const listed = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          ContinuationToken: continuationToken,
          MaxKeys: DELETE_BATCH_SIZE,
          Prefix: prefix,
        }),
      )

      const objects: ObjectIdentifier[] = (listed.Contents ?? [])
        .map((object) => object.Key)
        .filter((key): key is string => key !== undefined)
        .map((Key) => ({ Key }))

      if (objects.length > 0) {
        const response = await client.send(
          new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: { Objects: objects, Quiet: true },
          }),
        )
        // DeleteObjects resolves with HTTP 200 even when individual keys fail
        // (per-key failures land in `Errors`). Surface them as a throw so a
        // partial cleanup isn't silently ignored — the volume driver throws on
        // a failed rm.
        if (response.Errors && response.Errors.length > 0) {
          const summary = response.Errors.map(
            (error) => `${error.Key} (${error.Code})`,
          ).join(', ')
          throw new Error(
            `Failed to delete ${response.Errors.length} object(s): ${summary}`,
          )
        }
      }

      continuationToken = listed.IsTruncated
        ? listed.NextContinuationToken
        : undefined
    } while (continuationToken)
  }

  return {
    async delete(keys) {
      // A prefix key (trailing slash, or empty = whole store) is removed
      // recursively; a plain key removes a single object — matching the
      // ImageStore contract and the volume driver's `rm`.
      await Promise.all(
        keys.map((key) =>
          isPrefixKey(key)
            ? deletePrefix(resolveKey(key))
            : client.send(
                new DeleteObjectCommand({
                  Bucket: bucket,
                  Key: resolveKey(key),
                }),
              ),
        ),
      )
    },

    async exists(key) {
      // A prefix key is a "any object underneath?" check.
      if (isPrefixKey(key)) {
        const response = await client.send(
          new ListObjectsV2Command({
            Bucket: bucket,
            MaxKeys: 1,
            Prefix: resolveKey(key),
          }),
        )
        return (response.KeyCount ?? 0) > 0
      }

      try {
        await client.send(
          new HeadObjectCommand({ Bucket: bucket, Key: resolveKey(key) }),
        )
        return true
      } catch (error) {
        if (isNotFound(error)) return false
        throw error
      }
    },

    async getStream(key) {
      try {
        const response = await client.send(
          new GetObjectCommand({ Bucket: bucket, Key: resolveKey(key) }),
        )
        if (!response.Body) return null
        // On Node the SDK body is a Node Readable, not a web stream, so convert
        // it — the read path backs a web `Response` with this (the volume driver
        // does the same via Readable.toWeb).
        return response.Body.transformToWebStream()
      } catch (error) {
        if (isNotFound(error)) return null
        throw error
      }
    },

    async put(key, data, contentType) {
      // No object-level Cache-Control: images are served through the app read
      // path (/resources/*, behind Cloudflare), which sets the response header
      // itself, so the stored object's own cache headers are never used.
      await client.send(
        new PutObjectCommand({
          Body: data,
          Bucket: bucket,
          ContentType: contentType,
          Key: resolveKey(key),
        }),
      )
    },
  }
}
