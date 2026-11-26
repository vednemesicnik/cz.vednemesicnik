import { createReadStream } from 'node:fs'
import { mkdir, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, resolve, sep } from 'node:path'
import { Readable } from 'node:stream'

import type { ObjectStore } from './types'

// Volume-backed ObjectStore: objects live as plain files under `rootDir` on the
// Fly volume. Serving is a raw file stream — no transform on the read path.
export const createVolumeObjectStore = (rootDir: string): ObjectStore => {
  const root = resolve(rootDir)

  // Resolve a store key to an absolute path and guard against traversal.
  const toPath = (key: string) => {
    const path = resolve(root, key)
    if (path !== root && !path.startsWith(root + sep)) {
      throw new Error(`Object store key escapes root directory: ${key}`)
    }
    return path
  }

  return {
    async delete(keys) {
      // A trailing slash denotes a prefix (directory) removed recursively; a plain
      // key removes a single file. `resolve` normalises the trailing slash away,
      // so the traversal guard in `toPath` applies to both.
      await Promise.all(
        keys.map((key) => rm(toPath(key), { force: true, recursive: true })),
      )
    },

    async exists(key) {
      try {
        const stats = await stat(toPath(key))
        return stats.isFile() || stats.isDirectory()
      } catch {
        return false
      }
    },

    async getStream(key) {
      const path = toPath(key)
      try {
        const stats = await stat(path)
        if (!stats.isFile()) return null
      } catch {
        return null
      }
      // node:fs read stream → web ReadableStream for a Response body.
      return Readable.toWeb(createReadStream(path)) as ReadableStream
    },
    async put(key, data, _contentType) {
      const path = toPath(key)
      await mkdir(dirname(path), { recursive: true })
      await writeFile(path, data)
    },
  }
}
