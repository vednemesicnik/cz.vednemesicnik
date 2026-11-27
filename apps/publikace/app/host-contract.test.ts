import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import type { CreatePublikace } from '../../../server/start-publikace.ts'
import { createPublikace } from './publikace.server.ts'

/*
 * The host loads this module at run time and never typechecks it, so the shape it expects is
 * held here: `pnpm typecheck` fails when `createPublikace` stops fitting it.
 */
describe('the host contract', () => {
  it('exports createPublikace in the shape the host loads', () => {
    let loaded: CreatePublikace = createPublikace
    assert.equal(typeof loaded, 'function')
  })
})
