import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { contentsText, lastFullRunText, printLine } from './print-handoff.ts'
import { NBSP } from './public/typography.ts'

/* 13:00 in Prague. */
const TODAY = Temporal.Instant.from('2026-11-23T12:00:00Z')
/* 6:00 in Prague. */
const FILLED = Temporal.Instant.from('2026-11-23T05:00:00Z')
const NEXT = Temporal.Instant.from('2026-11-23T11:00:00Z')

function plain(text: string): string {
  return text.replaceAll(NBSP, ' ')
}

function lineText(line: ReturnType<typeof printLine>): string {
  return plain([...line.lead, ...(line.job === null ? [] : [line.job.text])].join(' · '))
}

describe('the contents of the print folder', () => {
  it('leaves out an empty kind and inflects each number on its own', () => {
    assert.equal(contentsText(1, 3), '1 text a 3 díla')
    assert.equal(contentsText(0, 3), '3 díla')
    assert.equal(contentsText(5, 0), '5 textů')
    assert.equal(contentsText(2, 1), '2 texty a 1 dílo')
    assert.equal(contentsText(21, 22), '21 textů a 22 děl')
    assert.equal(contentsText(0, 0), 'Zatím žádné texty ani díla')
  })

  it('says the last full run with the day, the date, or the date and year', () => {
    assert.equal(plain(lastFullRunText(FILLED, TODAY)), 'poslední celý běh dnes v 6:00')
    let earlier = Temporal.Instant.from('2026-11-13T21:00:00Z')
    assert.equal(plain(lastFullRunText(earlier, TODAY)), 'poslední celý běh 13. 11. ve 22:00')
    let lastYear = Temporal.Instant.from('2025-11-13T05:00:00Z')
    assert.equal(plain(lastFullRunText(lastYear, TODAY)), 'poslední celý běh 13. 11. 2025 v 6:00')
  })
})

describe('the line under Podklady pro tisk', () => {
  let summary = { artworks: 3, filledAt: FILLED, texts: 1 }

  it('ends with the estimate of the next run while there is one', () => {
    let line = printLine(summary, { kind: 'ok', lastStartedAt: FILLED, next: NEXT }, TODAY)
    assert.equal(
      lineText(line),
      '1 text a 3 díla · poslední celý běh dnes v 6:00 · další běh kolem 12:00',
    )
    assert.equal(line.job?.isLink, false)
  })

  it('ends after the time once the estimate passed, or while a run is under way', () => {
    let passed = printLine(summary, { kind: 'ok', lastStartedAt: FILLED, next: null }, TODAY)
    assert.equal(lineText(passed), '1 text a 3 díla · poslední celý běh dnes v 6:00')
    let running = printLine(summary, { kind: 'running', startedAt: NEXT }, TODAY)
    assert.equal(running.job, null)
  })

  it('links to the job after a failed run, and when it stopped', () => {
    let failed = printLine(
      summary,
      { isUnreported: false, kind: 'failed', lastStartedAt: FILLED, next: NEXT },
      TODAY,
    )
    assert.equal(
      lineText(failed),
      '1 text a 3 díla · poslední celý běh dnes v 6:00 · chyba při běhu úlohy',
    )
    assert.equal(failed.job?.isLink, true)
    let stopped = printLine(summary, { kind: 'stopped', lastStartedAt: FILLED }, TODAY)
    assert.equal(
      lineText(stopped),
      '1 text a 3 díla · poslední celý běh dnes v 6:00 · úloha teď neběží',
    )
  })

  it('has one sentence and no link before the job ever reported', () => {
    let line = printLine(summary, { kind: 'never' }, TODAY)
    assert.equal(lineText(line), 'Úloha se zatím neohlásila.')
    assert.equal(line.job, null)
  })

  it('says the job has not been through the issue, dropping the full stop before its part', () => {
    let waiting = printLine(null, { kind: 'ok', lastStartedAt: FILLED, next: NEXT }, TODAY)
    assert.equal(
      lineText(waiting),
      'Úloha tímto vydáním zatím neprošla celým · další běh kolem 12:00',
    )
    let alone = printLine(null, { kind: 'running', startedAt: NEXT }, TODAY)
    assert.equal(lineText(alone), 'Úloha tímto vydáním zatím neprošla celým.')
  })

  it('never breaks inside a part', () => {
    let line = printLine(summary, { kind: 'ok', lastStartedAt: FILLED, next: NEXT }, TODAY)
    for (let part of [...line.lead, line.job?.text ?? '']) assert.ok(!part.includes(' '), part)
  })
})
