// Storage abstraction over opaque binary objects (image variants, issue PDFs, …).
// Calling code (upload, serving, deletion) never touches the filesystem/object
// store directly, so the volume implementation can be swapped for a Tigris/S3
// adapter without any change to callers. Nothing here is content-type specific —
// each caller builds its own keys and picks its own namespace prefix.

export type ObjectStore = {
  // Write a single object under `key`.
  put: (key: string, data: Uint8Array, contentType: string) => Promise<void>
  // Read a single object as a web stream, or null if it does not exist.
  getStream: (key: string) => Promise<ReadableStream | null>
  // Whether an object exists under `key`.
  exists: (key: string) => Promise<boolean>
  // Remove objects. A key ending in "/" removes the whole prefix (directory).
  delete: (keys: string[]) => Promise<void>
}
