import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { versionLink } from './version-link.ts'

describe('versionLink', () => {
  it('links a release to its notes and shows its number without the v', () => {
    assert.deepEqual(versionLink({ kind: 'release', tag: 'publikace-v1.1.1', version: '1.1.1' }), {
      href: 'https://github.com/vednemesicnik/cz.vednemesicnik/releases/tag/publikace-v1.1.1',
      value: '1.1.1',
    })
  })

  it('links the commit alone to its own page', () => {
    assert.deepEqual(versionLink({ commit: '7a62267', kind: 'commit' }), {
      href: 'https://github.com/vednemesicnik/cz.vednemesicnik/commit/7a62267',
      value: '7a62267',
    })
  })

  it('links nothing for a development build', () => {
    assert.equal(versionLink({ kind: 'development' }), null)
  })
})
