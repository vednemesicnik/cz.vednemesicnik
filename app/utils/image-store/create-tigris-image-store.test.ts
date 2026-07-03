import { beforeEach, describe, expect, test, vi } from 'vitest'

import { createTigrisImageStore } from './create-tigris-image-store'

// One shared send mock stands in for the whole S3 client. Each command class is
// replaced by a tiny identity constructor that tags its type and captures its
// input, so tests can assert on what the store sends without any network.
const send = vi.fn()

vi.mock('@aws-sdk/client-s3', () => {
  const makeCommand = (type: string) =>
    class {
      readonly __type = type
      constructor(readonly input: unknown) {}
    }

  return {
    DeleteObjectCommand: makeCommand('DeleteObject'),
    DeleteObjectsCommand: makeCommand('DeleteObjects'),
    GetObjectCommand: makeCommand('GetObject'),
    HeadObjectCommand: makeCommand('HeadObject'),
    ListObjectsV2Command: makeCommand('ListObjectsV2'),
    PutObjectCommand: makeCommand('PutObject'),
    S3Client: class {
      send = send
    },
  }
})

const config = {
  accessKeyId: 'key',
  bucket: 'bucket',
  endpoint: 'https://fly.storage.tigris.dev',
  region: 'auto',
  secretAccessKey: 'secret',
}

// Read the tagged command type/input a sent command carries.
const sentCommand = (call: number) => {
  return send.mock.calls[call][0] as {
    __type: string
    input: Record<string, unknown>
  }
}

beforeEach(() => {
  send.mockReset()
})

describe('createTigrisImageStore', () => {
  test('throws when required configuration is missing', () => {
    expect(() => createTigrisImageStore({ ...config, bucket: '' })).toThrow(
      /BUCKET_NAME/,
    )
  })

  test('put sends PutObject with key, body, content type and immutable cache', async () => {
    send.mockResolvedValue({})
    const store = createTigrisImageStore(config)
    const data = new Uint8Array([1, 2, 3])

    await store.put('ab/id/v1/960.avif', data, 'image/avif')

    const { __type, input } = sentCommand(0)
    expect(__type).toBe('PutObject')
    expect(input).toMatchObject({
      Body: data,
      Bucket: 'bucket',
      CacheControl: 'public, max-age=31536000, immutable',
      ContentType: 'image/avif',
      Key: 'ab/id/v1/960.avif',
    })
  })

  test('getStream returns the object body as a web stream', async () => {
    const webStream = new ReadableStream()
    send.mockResolvedValue({ Body: { transformToWebStream: () => webStream } })
    const store = createTigrisImageStore(config)

    await expect(store.getStream('ab/id/v1/960.avif')).resolves.toBe(webStream)
    expect(sentCommand(0).__type).toBe('GetObject')
  })

  test('getStream returns null when the response has no body', async () => {
    send.mockResolvedValue({ Body: undefined })
    const store = createTigrisImageStore(config)

    await expect(store.getStream('ab/id/v1/960.avif')).resolves.toBeNull()
  })

  test('getStream returns null on a 404', async () => {
    send.mockRejectedValue({ name: 'NoSuchKey' })
    const store = createTigrisImageStore(config)

    await expect(store.getStream('missing')).resolves.toBeNull()
  })

  test('getStream rethrows non-404 errors', async () => {
    send.mockRejectedValue(new Error('network down'))
    const store = createTigrisImageStore(config)

    await expect(store.getStream('boom')).rejects.toThrow('network down')
  })

  test('exists returns true for a present object', async () => {
    send.mockResolvedValue({})
    const store = createTigrisImageStore(config)

    await expect(store.exists('ab/id/v1/960.avif')).resolves.toBe(true)
    expect(sentCommand(0).__type).toBe('HeadObject')
  })

  test('exists returns false for a missing object', async () => {
    send.mockRejectedValue({ $metadata: { httpStatusCode: 404 } })
    const store = createTigrisImageStore(config)

    await expect(store.exists('missing')).resolves.toBe(false)
  })

  test('exists checks a prefix via a listing', async () => {
    send.mockResolvedValue({ KeyCount: 1 })
    const store = createTigrisImageStore(config)

    await expect(store.exists('ab/id/')).resolves.toBe(true)
    const { __type, input } = sentCommand(0)
    expect(__type).toBe('ListObjectsV2')
    expect(input).toMatchObject({ MaxKeys: 1, Prefix: 'ab/id/' })
  })

  test('delete removes a single object when the key is not a prefix', async () => {
    send.mockResolvedValue({})
    const store = createTigrisImageStore(config)

    await store.delete(['ab/id/v1/960.avif'])

    const { __type, input } = sentCommand(0)
    expect(__type).toBe('DeleteObject')
    expect(input).toMatchObject({ Bucket: 'bucket', Key: 'ab/id/v1/960.avif' })
  })

  test('delete wipes a whole prefix via list + batched DeleteObjects', async () => {
    send.mockImplementation((command: { __type: string }) => {
      if (command.__type === 'ListObjectsV2') {
        return Promise.resolve({
          Contents: [
            { Key: 'ab/id/v1/320.avif' },
            { Key: 'ab/id/v1/320.jpeg' },
          ],
          IsTruncated: false,
        })
      }
      return Promise.resolve({})
    })
    const store = createTigrisImageStore(config)

    await store.delete(['ab/id/v1/'])

    expect(sentCommand(0).__type).toBe('ListObjectsV2')
    const del = sentCommand(1)
    expect(del.__type).toBe('DeleteObjects')
    const { Delete } = del.input as { Delete: { Objects: unknown } }
    expect(Delete.Objects).toEqual([
      { Key: 'ab/id/v1/320.avif' },
      { Key: 'ab/id/v1/320.jpeg' },
    ])
  })

  test('delete of an empty prefix issues no DeleteObjects request', async () => {
    send.mockResolvedValue({ Contents: [], IsTruncated: false })
    const store = createTigrisImageStore(config)

    await store.delete(['ab/empty/'])

    expect(send).toHaveBeenCalledTimes(1)
    expect(sentCommand(0).__type).toBe('ListObjectsV2')
  })
})
