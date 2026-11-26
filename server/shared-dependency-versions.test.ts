import { readFile } from 'node:fs/promises'

import { expect, test } from 'vitest'

type Manifest = {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

const readManifest = async (path: string): Promise<Manifest> =>
  JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'))

const allDependencies = (manifest: Manifest) => ({
  ...manifest.devDependencies,
  ...manifest.dependencies,
})

// The host and the web run in one process. A package both declare must have one version,
// so pnpm links one copy: the instrument then initialises the Sentry client the web
// reports to, and the host's React Router is the one the build was made with.
test('the host and the web declare every shared package at the same version', async () => {
  const host = allDependencies(await readManifest('../package.json'))
  const web = allDependencies(await readManifest('../apps/web/package.json'))

  const shared = Object.keys(host).filter((name) => name in web)
  const hostVersions = Object.fromEntries(
    shared.map((name) => [name, host[name]]),
  )
  const webVersions = Object.fromEntries(
    shared.map((name) => [name, web[name]]),
  )

  expect(shared).toContain('react-router')
  expect(shared).toContain('@sentry/react-router')
  expect(hostVersions).toEqual(webVersions)
})
