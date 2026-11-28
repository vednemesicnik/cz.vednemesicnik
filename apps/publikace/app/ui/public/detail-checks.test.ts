import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { checkInTurn } from './detail-checks.ts'

/** An island that has gone, so a turn that changed something reloads nothing and needs no page. */
const GONE = { isCurrent: () => false, reload: () => Promise.resolve() }

/**
 * A check that answers when told to, also when told before it was asked (the turn asks it a
 * microtask later), and counts how often it was asked.
 */
function pending() {
  let given: boolean | null = null
  let resolve: ((isChanged: boolean) => void) | null = null
  let asks = 0
  let check = () => {
    asks += 1
    return new Promise<boolean>((done) => {
      if (given === null) resolve = done
      else done(given)
    })
  }
  let answer = (isChanged: boolean) => {
    if (resolve === null) given = isChanged
    else resolve(isChanged)
  }
  return { answer, asks: () => asks, check }
}

/** Whether a promise has settled, after the microtasks queued so far. */
async function isSettled(promise: Promise<unknown>): Promise<boolean> {
  let isDone = false
  void promise.then(() => {
    isDone = true
  })
  await new Promise((resolve) => setTimeout(resolve, 0))
  return isDone
}

describe('checkInTurn', () => {
  it('asks the checks of one load one after another', async () => {
    let first = pending()
    let second = pending()
    let asked = checkInTurn('l1', 'doc', first.check, GONE)
    void checkInTurn('l1', 'folders', second.check, GONE)
    await isSettled(asked)
    assert.equal(first.asks(), 1)
    assert.equal(second.asks(), 0, 'the second waits for the first')
    first.answer(false)
    await isSettled(asked)
    assert.equal(second.asks(), 1)
    second.answer(false)
  })

  it('settles a check that found nothing while another of the load is still asking', async () => {
    let first = pending()
    let second = pending()
    let foundNothing = checkInTurn('l2', 'folders', first.check, GONE)
    let stillAsking = checkInTurn('l2', 'doc', second.check, GONE)
    first.answer(false)
    assert.ok(await isSettled(foundNothing))
    assert.ok(!(await isSettled(stillAsking)))
    second.answer(false)
    assert.ok(await isSettled(stillAsking))
  })

  it('settles a check that changed something only once the whole turn has ended', async () => {
    let first = pending()
    let second = pending()
    let changed = checkInTurn('l3', 'folders', first.check, GONE)
    void checkInTurn('l3', 'doc', second.check, GONE)
    first.answer(true)
    assert.ok(!(await isSettled(changed)), 'it waits for the reload the turn may start')
    second.answer(false)
    assert.ok(await isSettled(changed))
  })

  it('asks once however many islands ask for the same kind', async () => {
    let check = pending()
    let one = checkInTurn('l4', 'folders', check.check, GONE)
    let other = checkInTurn('l4', 'folders', check.check, GONE)
    check.answer(false)
    assert.ok(await isSettled(one))
    assert.ok(await isSettled(other))
    assert.equal(check.asks(), 1)
  })

  it('reloads once, through an island that is still current, when a check changed something', async () => {
    let reloads = 0
    let current = {
      isCurrent: () => true,
      reload: () => {
        reloads += 1
        return Promise.resolve()
      },
    }
    let cookies: string[] = []
    let page = globalThis as { document?: unknown }
    page.document = {
      querySelector: () => null,
      set cookie(value: string) {
        cookies.push(value)
      },
    }
    try {
      let first = pending()
      let second = pending()
      let one = checkInTurn('l5', 'folders', first.check, GONE)
      let other = checkInTurn('l5', 'doc', second.check, current)
      first.answer(true)
      await isSettled(one)
      second.answer(true)
      await Promise.all([one, other])
      assert.equal(reloads, 1)
      assert.ok(cookies[0]?.startsWith('issueDetailReload=l5;'))
      assert.ok(cookies[1]?.startsWith('issueDetailReload=;'), 'cleared after the reload')
    } finally {
      delete page.document
    }
  })

  it('names the load whose toast was closed beside the reload, and clears both after it (#1137)', async () => {
    let current = { isCurrent: () => true, reload: () => Promise.resolve() }
    let cookies: string[] = []
    let page = globalThis as { document?: unknown }
    page.document = {
      querySelector: (selector: string) => (selector === '.vdm-toast[data-closed]' ? {} : null),
      set cookie(value: string) {
        cookies.push(value)
      },
    }
    try {
      let check = pending()
      let asked = checkInTurn('l6', 'doc', check.check, current)
      check.answer(true)
      await asked
      assert.deepEqual(
        cookies.map((cookie) => cookie.split(';')[0]),
        [
          'issueDetailReload=l6',
          'issueDetailToastClosed=l6',
          'issueDetailReload=',
          'issueDetailToastClosed=',
        ],
      )
    } finally {
      delete page.document
    }
  })
})
