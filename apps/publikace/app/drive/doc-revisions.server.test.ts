import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import type { DocCheckTarget } from '../data/articles.server.ts'
import type { FilePlace } from './artwork-files.server.ts'
import { checkDocRevisions } from './doc-revisions.server.ts'

const BASELINE = Temporal.Instant.from('2026-11-21T09:07:00Z')
const TARGET: DocCheckTarget = {
  articleId: 7,
  baseline: BASELINE,
  checkedAt: BASELINE,
  docId: 'd-7',
  markedAt: Temporal.Instant.from('2026-11-21T09:12:00Z'),
}

function at(iso: string): Temporal.Instant {
  return Temporal.Instant.from(iso)
}

function deps(place: FilePlace, revisions: Temporal.Instant[] | null) {
  let recorded: unknown[] = []
  let listed = 0
  return {
    deps: {
      articles: {
        async recordDocCheck(...args: unknown[]) {
          recorded.push(args)
        },
      },
      files: {
        async placeOf() {
          return place
        },
        async revisionTimesOf() {
          listed += 1
          return revisions
        },
      },
    },
    listed: () => listed,
    recorded,
  }
}

describe('checkDocRevisions', () => {
  it('lists nothing while modifiedTime is no later than the last check', async () => {
    let probe = deps({ kind: 'here', modifiedAt: BASELINE, parents: [] }, [])
    assert.equal(await checkDocRevisions(probe.deps, TARGET), 'unchanged')
    assert.equal(probe.listed(), 0)
    assert.deepEqual(probe.recorded, [])
  })

  it('records the newest revision after the baseline, and the modifiedTime it examined', async () => {
    let modifiedAt = at('2026-11-22T07:30:00Z')
    let probe = deps({ kind: 'here', modifiedAt, parents: [] }, [
      at('2026-11-21T08:00:00Z'),
      at('2026-11-22T07:12:00Z'),
      at('2026-11-21T20:00:00Z'),
    ])
    assert.deepEqual(await checkDocRevisions(probe.deps, TARGET), {
      revisedAt: at('2026-11-22T07:12:00Z'),
    })
    assert.deepEqual(probe.recorded, [
      [7, TARGET.markedAt, { checkedAt: modifiedAt, revisedAt: at('2026-11-22T07:12:00Z') }],
    ])
  })

  it('records a check without a revision when only a comment moved modifiedTime', async () => {
    let modifiedAt = at('2026-11-22T07:30:00Z')
    let probe = deps({ kind: 'here', modifiedAt, parents: [] }, [at('2026-11-21T08:00:00Z')])
    assert.deepEqual(await checkDocRevisions(probe.deps, TARGET), { revisedAt: null })
    assert.deepEqual(probe.recorded, [
      [7, TARGET.markedAt, { checkedAt: modifiedAt, revisedAt: null }],
    ])
  })

  it('records nothing when Drive does not answer or the Doc is gone', async () => {
    let failing = deps({ kind: 'here', modifiedAt: at('2026-11-22T07:30:00Z'), parents: [] }, null)
    assert.equal(await checkDocRevisions(failing.deps, TARGET), 'unavailable')
    assert.deepEqual(failing.recorded, [])
    let gone = deps({ kind: 'gone' }, [])
    assert.equal(await checkDocRevisions(gone.deps, TARGET), 'unavailable')
    assert.equal(gone.listed(), 0)
  })
})
