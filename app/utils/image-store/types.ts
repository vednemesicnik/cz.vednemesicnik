// Storage abstraction over pre-generated image variants. Calling code (upload,
// serving, deletion) never touches the filesystem/object store directly, so the
// volume implementation can later be swapped for a Tigris/S3 adapter without any
// change to callers.

export type ImageStore = {
  // Write a single object under `key`.
  put: (key: string, data: Uint8Array, contentType: string) => Promise<void>
  // Read a single object as a web stream, or null if it does not exist.
  getStream: (key: string) => Promise<ReadableStream | null>
  // Whether an object exists under `key`.
  exists: (key: string) => Promise<boolean>
  // Remove objects. A key ending in "/" removes the whole prefix (directory).
  delete: (keys: string[]) => Promise<void>
}
