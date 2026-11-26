import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import type { JobHealth, JobState } from './job-run.ts'
import {
  archiveFailedText,
  articleKindLine,
  discardedBatchText,
  kindLine,
  otherKindText,
  readLines,
  receivedLine,
  reviewKindOf,
  verifiedToast,
} from './review.ts'

describe('the filter of kinds', () => {
  it('reads each kind from the address, and anything else as Vše', () => {
    assert.equal(reviewKindOf('articles'), 'articles')
    assert.equal(reviewKindOf('artworks'), 'artworks')
    assert.equal(reviewKindOf('all'), 'all')
    assert.equal(reviewKindOf(null), 'all')
    assert.equal(reviewKindOf('batches'), 'all')
  })

  it('counts the items Vše would show, with the number’s form', () => {
    assert.equal(otherKindText(1), 'Filtr Vše ukáže 1 položku.')
    assert.equal(otherKindText(3), 'Filtr Vše ukáže 3 položky.')
    assert.equal(otherKindText(5), 'Filtr Vše ukáže 5 položek.')
  })
})

const TODAY = Temporal.Instant.from('2026-11-19T09:10:00Z')
const LAST = Temporal.Instant.from('2026-11-19T08:00:00Z')
const NEXT = Temporal.Instant.from('2026-11-19T08:30:00Z')

const RUNNING: JobHealth = { kind: 'running', lastStartedAt: LAST, next: NEXT }
const PASSED: JobHealth = { kind: 'running', lastStartedAt: LAST, next: null }
const STOPPED: JobHealth = { kind: 'stopped', lastStartedAt: LAST }
const NEVER: JobHealth = { kind: 'never' }

describe('the queue’s lines', () => {
  it('names the kind, the artworks and the issue', () => {
    assert.equal(kindLine(2, 'VDM_2026_5'), 'Obrazová díla · 2 díla · VDM_2026_5')
  })

  it('says when a reply arrived, with v or ve, and the year only in another one', () => {
    let at = Temporal.Instant.from('2026-11-14T06:12:00Z')
    assert.equal(
      receivedLine('Klára Šimková', 'klara.simkova@external.test', at, TODAY),
      'Klára Šimková · klara.simkova@external.test · přijato 14. 11. v\u00a07:12',
    )
    let late = Temporal.Instant.from('2025-11-13T20:47:00Z')
    assert.match(
      receivedLine('Petr Malý', 'p@external.test', late, TODAY),
      /13\. 11\. 2025 ve 21:47$/,
    )
  })

  it('says how each job’s last read ended, one line a job in the filter’s order', () => {
    let ok: JobState = { kind: 'ok', lastStartedAt: LAST, next: NEXT }
    let failed: JobState = { isUnreported: false, kind: 'failed', lastStartedAt: LAST, next: NEXT }
    assert.deepEqual(readLines({ articles: ok, artworks: failed }, 'all', TODAY), [
      {
        job: null,
        parts: [
          { after: '', before: 'Články: čtení z\u00a09:00 dokončeno', link: null },
          { after: '', before: 'další běh kolem 9:30', link: null },
        ],
      },
      {
        job: 'artwork-replies',
        parts: [
          { after: '', before: 'Obrazová díla: ', link: 'čtení z\u00a09:00 skončilo chybou' },
          { after: '', before: 'další běh kolem 9:30', link: null },
        ],
      },
    ])
  })

  it('calls a run that never reported its end no result, not an error, and links its job', () => {
    let unreported: JobState = {
      isUnreported: true,
      kind: 'failed',
      lastStartedAt: LAST,
      next: null,
    }
    assert.deepEqual(readLines({ articles: unreported, artworks: NEVER }, 'articles', TODAY), [
      {
        job: 'approval-send',
        parts: [{ after: '', before: 'Články: ', link: 'čtení z\u00a09:00 zatím bez výsledku' }],
      },
    ])
  })

  it('drops the estimate once it passed, and gives no time while a run is under way', () => {
    let passed: JobState = { kind: 'ok', lastStartedAt: LAST, next: null }
    let running: JobState = { kind: 'running', startedAt: LAST }
    assert.deepEqual(readLines({ articles: running, artworks: passed }, 'all', TODAY), [
      { job: null, parts: [{ after: '', before: 'Články: probíhá čtení odpovědí', link: null }] },
      {
        job: null,
        parts: [{ after: '', before: 'Obrazová díla: čtení z\u00a09:00 dokončeno', link: null }],
      },
    ])
  })

  it('reads with ze where the hour or the day asks for it, and gives the date on another day', () => {
    let at = (instant: string): JobState => ({
      kind: 'ok',
      lastStartedAt: Temporal.Instant.from(instant),
      next: null,
    })
    let first = (state: JobState) =>
      readLines({ articles: state, artworks: NEVER }, 'articles', TODAY)[0]?.parts[0]?.before
    assert.equal(first(at('2026-11-19T06:05:00Z')), 'Články: čtení ze 7:05 dokončeno')
    assert.equal(
      first(at('2026-11-18T08:12:00Z')),
      'Články: čtení z\u00a018. 11. v\u00a09:12 dokončeno',
    )
    assert.equal(
      first(at('2026-11-22T08:12:00Z')),
      'Články: čtení ze 22. 11. v\u00a09:12 dokončeno',
    )
    assert.equal(
      first(at('2025-11-22T08:12:00Z')),
      'Články: čtení ze 22. 11. 2025 v\u00a09:12 dokončeno',
    )
  })

  it('puts a stopped or a silent job’s sentence in its own line’s place', () => {
    let ok: JobState = { kind: 'ok', lastStartedAt: LAST, next: NEXT }
    let stopped: JobState = { kind: 'stopped', lastStartedAt: LAST }
    let never: JobState = { kind: 'never' }
    let lines = readLines({ articles: ok, artworks: stopped }, 'all', TODAY)
    assert.equal(lines.length, 2)
    assert.deepEqual(lines[1], {
      job: null,
      parts: [{ after: '', before: '', link: 'Čtení odpovědí k\u00a0obrazovým dílům teď neběží.' }],
    })
    assert.deepEqual(readLines({ articles: never, artworks: ok }, 'all', TODAY)[0], {
      job: null,
      parts: [
        {
          after: ' se zatím neohlásila.',
          before: 'Úloha ',
          link: 'Žádosti a\u00a0odpovědi u\u00a0článků',
        },
      ],
    })
    assert.deepEqual(readLines({ articles: stopped, artworks: never }, 'all', TODAY), [
      {
        job: null,
        parts: [{ after: '', before: '', link: 'Čtení odpovědí u\u00a0článků teď neběží.' }],
      },
      {
        job: null,
        parts: [
          {
            after: ' se zatím neohlásila.',
            before: 'Úloha ',
            link: 'Odpovědi k\u00a0obrazovým dílům',
          },
        ],
      },
    ])
  })

  it('gives one sentence for two jobs that both stopped or never reported, but not under a kind', () => {
    let stopped: JobState = { kind: 'stopped', lastStartedAt: LAST }
    let never: JobState = { kind: 'never' }
    let both = (state: JobState) => ({ articles: state, artworks: state })
    assert.deepEqual(readLines(both(stopped), 'all', TODAY), [
      {
        job: null,
        parts: [
          {
            after: '',
            before: '',
            link: 'Čtení odpovědí u\u00a0článků i\u00a0obrazových děl teď neběží.',
          },
        ],
      },
    ])
    assert.deepEqual(readLines(both(never), 'all', TODAY), [
      {
        job: null,
        parts: [
          {
            after: '',
            before: '',
            link: 'Žádná z\u00a0úloh pro čtení odpovědí se zatím neohlásila.',
          },
        ],
      },
    ])
    assert.deepEqual(readLines(both(stopped), 'artworks', TODAY), [
      {
        job: null,
        parts: [
          { after: '', before: '', link: 'Čtení odpovědí k\u00a0obrazovým dílům teď neběží.' },
        ],
      },
    ])
  })

  it('names an article’s final version and its issue', () => {
    assert.equal(articleKindLine('VDM_2026_5'), 'Finální verze článku · VDM_2026_5')
  })

  it('promises an archive only while there is an estimate', () => {
    assert.equal(
      verifiedToast(RUNNING),
      'Souhlas zaznamenán. Pokus o\u00a0uložení konverzace proběhne kolem 9:30.',
    )
    assert.equal(verifiedToast(PASSED), 'Souhlas zaznamenán. Konverzace čeká na uložení.')
    assert.equal(verifiedToast(NEVER), 'Souhlas zaznamenán. Konverzace čeká na uložení.')
    assert.equal(verifiedToast(STOPPED), 'Konverzace čeká na uložení. Úloha teď neběží.')
  })

  it('says when the failed archive will be tried again', () => {
    assert.match(archiveFailedText(RUNNING), /proběhne kolem 9:30\.$/)
    assert.match(archiveFailedText(NEVER), /při dalším běhu úlohy\.$/)
    assert.match(archiveFailedText(STOPPED), /teď neběží\.$/)
  })

  it('tells the editors a batch is discarded before they decide', () => {
    assert.match(
      discardedBatchText(Temporal.Instant.from('2026-11-18T10:00:00Z'), TODAY),
      /^Dávka je od 18\. 11\. zahozená\. /,
    )
  })
})
