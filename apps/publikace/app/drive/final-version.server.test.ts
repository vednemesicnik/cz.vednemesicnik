import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { now } from '../domain/time.ts'
import { testRowId } from '../test-row-id.ts'
import { cancelFinalVersion, type FinalVersionSetup } from './final-version.server.ts'

describe('cancelling a final version', () => {
  it('answers unavailable when the database refuses the cancel, and reports it', async (t) => {
    t.mock.method(console, 'error', () => {})
    let areas: string[] = []
    let setup = {
      articles: {
        cancelFinalVersion: async () => {
          throw new Error('database is locked')
        },
      },
      now,
      reportError: (_: unknown, area: string) => areas.push(area),
    } as unknown as FinalVersionSetup

    let outcome = await cancelFinalVersion(setup, { id: testRowId(7), markedAt: now() })

    assert.deepEqual(outcome, { kind: 'unavailable' })
    assert.deepEqual(areas, ['data'])
  })
})
