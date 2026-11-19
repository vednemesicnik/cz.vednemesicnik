import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { withoutLinkKey } from './public-link.server.ts'

const KEY = 'k7Qm2xR4pT9a'

describe('withoutLinkKey', () => {
  it('replaces the key and keeps the rest of the path', () => {
    assert.equal(withoutLinkKey(`/l/${KEY}/article`), '/l/…/article')
    assert.equal(
      withoutLinkKey(`/l/${KEY}/artworks/files/7/remove`),
      '/l/…/artworks/files/7/remove',
    )
    assert.equal(withoutLinkKey(`/l/${KEY}`), '/l/…')
  })

  it('leaves a path outside /l/ alone', () => {
    assert.equal(withoutLinkKey('/issues/2026-01'), '/issues/2026-01')
  })
})
