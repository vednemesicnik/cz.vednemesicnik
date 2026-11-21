import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { cardActions, partOf, type QueueItem, queueParts } from './proofreading-queue.ts'

const DAY = Temporal.Instant.from('2026-11-16T08:00:00Z')
const LENKA = { email: 'lenka.svobodova@vednemesicnik.test', name: 'Lenka Svobodová' }
const JAKUB = { email: 'jakub.novak@vednemesicnik.test', name: 'Jakub Novák' }
const MARIE = { email: 'marie@vednemesicnik.test', name: 'Marie Horáková' }

const PROOFREADER = { email: LENKA.email, isEditor: false, isProofreader: true }
const EDITOR = { email: MARIE.email, isEditor: true, isProofreader: false }

function at(days: number): Temporal.Instant {
  return DAY.add({ hours: 24 * days })
}

function item(id: number, overrides: Partial<QueueItem> = {}): QueueItem {
  return {
    cancelledProofreading: null,
    createdAt: at(0),
    handover: null,
    id,
    proofreading: null,
    ...overrides,
  }
}

describe('the parts of the page Korektura', () => {
  it('puts each article in its part, and orders a part by the time it waits on', () => {
    let articles = [
      item(1, { handover: { at: at(3), ...MARIE } }),
      item(2, { handover: { at: at(1), ...MARIE } }),
      item(3, { proofreading: { at: at(2), ...LENKA } }),
      item(4, { proofreading: { at: at(1), ...JAKUB } }),
      item(5, { createdAt: at(2) }),
      item(6, { createdAt: at(1) }),
    ]
    let parts = queueParts(articles, PROOFREADER)
    assert.deepEqual(
      Object.fromEntries(
        Object.entries(parts).map(([part, list]) => [part, list.map((a) => a.id)]),
      ),
      { mine: [3], others: [4], waiting: [2, 1], writing: [6, 5] },
    )
    assert.deepEqual(
      queueParts(articles, EDITOR).others.map((a) => a.id),
      [4, 3],
    )
  })

  it('keeps a card just taken in the part it was in, at its place', () => {
    let articles = [
      item(1, { handover: { at: at(1), ...MARIE }, proofreading: { at: at(4), ...LENKA } }),
      item(2, { handover: { at: at(2), ...MARIE } }),
    ]
    let parts = queueParts(articles, PROOFREADER, { id: 1, part: 'waiting' })
    assert.deepEqual(
      parts.waiting.map((a) => a.id),
      [1, 2],
    )
    assert.equal(parts.mine.length, 0)
    assert.equal(partOf(articles[0] ?? item(0), PROOFREADER), 'mine')
  })

  it('gives the take to a proofreader only, and the cancel to the owner or an editor-in-chief', () => {
    let waiting = item(1, { handover: { at: at(1), ...MARIE } })
    let lenkas = item(2, { proofreading: { at: at(1), ...LENKA } })
    let jakubs = item(3, { proofreading: { at: at(1), ...JAKUB } })

    assert.deepEqual(cardActions(waiting, PROOFREADER), { canCancel: false, canTake: true })
    assert.deepEqual(cardActions(waiting, EDITOR), { canCancel: false, canTake: false })
    assert.deepEqual(cardActions(lenkas, PROOFREADER), { canCancel: true, canTake: false })
    assert.deepEqual(cardActions(jakubs, PROOFREADER), { canCancel: false, canTake: false })
    assert.deepEqual(cardActions(jakubs, EDITOR), { canCancel: true, canTake: false })
  })
})
