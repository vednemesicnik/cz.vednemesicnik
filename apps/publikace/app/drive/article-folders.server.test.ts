import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { testRowId } from '../test-row-id.ts'
import { checkArticleFolders } from './article-folders.server.ts'

describe('checking an article’s folders', () => {
  it('asks Drive about the three at once (#1122)', async () => {
    let inFlight = 0
    let most = 0
    let check = await checkArticleFolders(
      {
        articles: { clearMissing: async () => {}, markMissing: async () => {} },
        folders: {
          async standing() {
            inFlight += 1
            most = Math.max(most, inFlight)
            await new Promise((resolve) => setImmediate(resolve))
            inFlight -= 1
            return 'exists'
          },
        },
        now: () => Temporal.Now.instant(),
      },
      {
        artworksFolderId: 'folder-artworks',
        folderId: 'folder-article',
        id: testRowId(1),
        kind: 'article',
        licencesFolderId: 'folder-licences',
      },
    )
    assert.deepEqual(check, { missing: [] })
    assert.equal(most, 3)
  })
})
