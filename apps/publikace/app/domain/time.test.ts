import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { atTime, formatDate, formatDay, parseStamp, stamp } from './time.ts'

function prague(text: string): Temporal.Instant {
  return Temporal.ZonedDateTime.from(`${text}[Europe/Prague]`).toInstant()
}

describe('time', () => {
  it('stamps instants at one width, so text order is time order', () => {
    let whole = stamp(Temporal.Instant.from('2026-11-17T08:12:00Z'))
    let fraction = stamp(Temporal.Instant.from('2026-11-17T08:12:00.5Z'))

    assert.equal(whole, '2026-11-17T08:12:00.000Z')
    assert.ok(whole < fraction)
    assert.equal(parseStamp(whole)?.epochMilliseconds, Date.UTC(2026, 10, 17, 8, 12))
    assert.equal(parseStamp('včera'), null)
  })

  it('says the time in Prague with ve before the hours that need it', () => {
    assert.equal(atTime(prague('2026-11-17T14:38')), 've 14:38')
    assert.equal(atTime(prague('2026-11-17T02:05')), 've 2:05')
    assert.equal(atTime(prague('2026-11-17T21:47')), 've 21:47')
    assert.equal(atTime(prague('2026-11-17T09:12')), 'v\u00a09:12')
    assert.equal(atTime(prague('2026-11-17T18:04')), 'v\u00a018:04')
  })

  it('names today and yesterday by Prague days, and any other day by its date', () => {
    let today = prague('2026-11-17T00:30')

    assert.equal(formatDay(prague('2026-11-17T00:10'), today), 'dnes')
    assert.equal(formatDay(prague('2026-11-16T23:50'), today), 'včera')
    assert.equal(formatDay(prague('2026-11-10T12:00'), today), '10. 11. 2026')
    assert.equal(formatDate(prague('2026-11-10T00:30')), '10. 11. 2026')
  })
})
