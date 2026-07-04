#!/usr/bin/env node

// object-store CLI — manage the S3/Tigris bucket (images/ and pdfs/) directly
// from `fly ssh`, instead of writing one-off scripts. Baked into the production
// image as /usr/local/bin/object-store and run via Node 24 native TypeScript
// type stripping (see scripts/object-store.sh) — no tsx.
//
// Self-contained on purpose: it imports only @aws-sdk/client-s3 (already a
// production dependency) plus Node built-ins, so it needs none of the app's
// path-aliased source, which the minimal prod image doesn't ship. It mirrors the
// command/config patterns of app/utils/object-store/create-tigris-object-store.ts.

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  type ObjectIdentifier,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'

// S3 caps a single DeleteObjects request at 1000 keys.
const DELETE_BATCH_SIZE = 1000

// Extension → Content-Type. Covers the formats this bucket actually stores
// (AVIF/JPEG image variants, PDFs); anything else falls back to a binary type.
const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  '.avif': 'image/avif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.webp': 'image/webp',
}
const DEFAULT_CONTENT_TYPE = 'application/octet-stream'

const USAGE = `object-store — manage the S3/Tigris bucket

Usage:
  object-store ls [prefix]        List objects (optionally under a key prefix)
  object-store stat <key>         Show metadata for a single object
  object-store put <file> <key>   Upload a local file to a key
  object-store rm <key>           Delete an object; a trailing "/" deletes recursively
  object-store --help             Show this help

Configuration (env): AWS_ENDPOINT_URL_S3, AWS_REGION, BUCKET_NAME,
AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY.`

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

// Fail loud and early: the CLI is useless without full bucket credentials.
function readConfig() {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3 ?? ''
  const region = process.env.AWS_REGION ?? ''
  const bucket = process.env.BUCKET_NAME ?? ''
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID ?? ''
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY ?? ''

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
    throw new Error(`Missing required configuration: ${missing.join(', ')}.`)
  }

  return { accessKeyId, bucket, endpoint, region, secretAccessKey }
}

function requireArg(value: string | undefined, usage: string): string {
  if (value === undefined) {
    throw new Error(`Missing argument. Usage: object-store ${usage}`)
  }
  return value
}

// List objects to stdout ("<size>  <key>" per line), object count to stderr so a
// piped stdout stays clean.
async function listObjects(client: S3Client, bucket: string, prefix: string) {
  let continuationToken: string | undefined
  let count = 0

  do {
    const listed = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: continuationToken,
        Prefix: prefix || undefined,
      }),
    )

    for (const object of listed.Contents ?? []) {
      if (object.Key === undefined) continue
      console.log(`${String(object.Size ?? 0).padStart(12)}  ${object.Key}`)
      count += 1
    }

    continuationToken = listed.IsTruncated
      ? listed.NextContinuationToken
      : undefined
  } while (continuationToken)

  console.error(`${count} object(s)${prefix ? ` under "${prefix}"` : ''}`)
}

async function statObject(client: S3Client, bucket: string, key: string) {
  try {
    const head = await client.send(
      new HeadObjectCommand({ Bucket: bucket, Key: key }),
    )
    console.log(`Key:           ${key}`)
    console.log(`ContentType:   ${head.ContentType ?? '-'}`)
    console.log(`ContentLength: ${head.ContentLength ?? 0}`)
    console.log(`LastModified:  ${head.LastModified?.toISOString() ?? '-'}`)
    console.log(`ETag:          ${head.ETag ?? '-'}`)
  } catch (error) {
    if (isNotFound(error)) {
      console.error(`not found: ${key}`)
      process.exitCode = 1
      return
    }
    throw error
  }
}

async function putObject(
  client: S3Client,
  bucket: string,
  file: string,
  key: string,
) {
  const body = await readFile(file)
  const contentType =
    CONTENT_TYPE_BY_EXT[path.extname(file).toLowerCase()] ??
    DEFAULT_CONTENT_TYPE

  await client.send(
    new PutObjectCommand({
      Body: body,
      Bucket: bucket,
      ContentType: contentType,
      Key: key,
    }),
  )

  console.error(`put ${key} (${body.byteLength} bytes, ${contentType})`)
}

// Remove every object under a prefix, page by page (mirrors the Tigris store's
// deletePrefix): list one page capped at the DeleteObjects limit, delete it, then
// continue — so memory stays bounded. Returns the number of objects deleted.
async function deletePrefix(client: S3Client, bucket: string, prefix: string) {
  let continuationToken: string | undefined
  let deleted = 0

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
      // (per-key failures land in `Errors`); surface them as a throw so a partial
      // cleanup isn't silently ignored.
      if (response.Errors && response.Errors.length > 0) {
        const summary = response.Errors.map(
          (error) => `${error.Key} (${error.Code})`,
        ).join(', ')
        throw new Error(
          `Failed to delete ${response.Errors.length} object(s): ${summary}`,
        )
      }
      deleted += objects.length
    }

    continuationToken = listed.IsTruncated
      ? listed.NextContinuationToken
      : undefined
  } while (continuationToken)

  return deleted
}

async function removeObject(client: S3Client, bucket: string, key: string) {
  // A trailing "/" addresses a prefix (directory) and is removed recursively; a
  // plain key removes a single object.
  if (key.endsWith('/')) {
    const deleted = await deletePrefix(client, bucket, key)
    console.error(`removed ${deleted} object(s) under "${key}"`)
    return
  }

  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
  console.error(`removed ${key}`)
}

async function main() {
  const [command, ...rest] = process.argv.slice(2)

  if (!command || command === '--help' || command === '-h') {
    console.log(USAGE)
    return
  }

  const config = readConfig()
  const client = new S3Client({
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    endpoint: config.endpoint,
    // Tigris (and S3Mock) work with path-style addressing regardless of DNS.
    forcePathStyle: true,
    region: config.region,
  })

  switch (command) {
    case 'ls':
      await listObjects(client, config.bucket, rest[0] ?? '')
      break
    case 'stat':
      await statObject(client, config.bucket, requireArg(rest[0], 'stat <key>'))
      break
    case 'put':
      await putObject(
        client,
        config.bucket,
        requireArg(rest[0], 'put <file> <key>'),
        requireArg(rest[1], 'put <file> <key>'),
      )
      break
    case 'rm':
      await removeObject(client, config.bucket, requireArg(rest[0], 'rm <key>'))
      break
    default:
      console.error(`Unknown command: ${command}\n`)
      console.error(USAGE)
      process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
