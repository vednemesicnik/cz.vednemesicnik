import * as assert from 'remix/assert'
import { after, before, describe, it } from 'remix/test'

import { type Assets, createAssets } from './assets.ts'

let assets: Assets

function fetchAsset(path: string) {
  return assets.server.fetch(new Request(new URL(path, 'http://localhost')))
}

describe('asset server', () => {
  before(async () => {
    assets = await createAssets({ NODE_ENV: 'test' })
  })

  after(async () => {
    await assets.close()
  })

  it('serves the design system stylesheet', async () => {
    let response = await fetchAsset(assets.stylesheetHref)

    assert.equal(response?.status, 200)
    assert.match(response?.headers.get('Content-Type') ?? '', /text\/css/)
  })

  it('serves the font the stylesheet points at', async () => {
    let response = await fetchAsset(
      '/assets/app/ui/public/ds/tokens/font-files/InterVariable.woff2',
    )

    assert.equal(response?.status, 200)
  })

  it('refuses server modules, controllers and tests', async () => {
    for (let path of [
      '/assets/app/data/database.server.ts',
      '/assets/app/actions/controller.tsx',
      '/assets/app/assets.test.ts',
    ]) {
      let response = await fetchAsset(path)
      assert.notEqual(response?.status, 200, path)
    }
  })
})
