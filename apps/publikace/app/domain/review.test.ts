import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import type { JobHealth } from './job-run.ts'
import {
  archiveFailedText,
  articleKindLine,
  discardedBatchText,
  kindLine,
  readLine,
  receivedLine,
  verifiedToast,
} from './review.ts'

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

  it('reads the jobs: the time and the estimate, the passed estimate, a stopped job and none', () => {
    let both = (health: JobHealth) => ({ articles: health, artworks: health })
    assert.deepEqual(readLine(both(RUNNING), TODAY), {
      after: '',
      before: 'Odpovědi čteny v\u00a09:00 · další běh kolem 9:30',
      link: null,
    })
    assert.deepEqual(readLine(both(PASSED), TODAY), {
      after: '',
      before: 'Odpovědi čteny v\u00a09:00',
      link: null,
    })
    assert.deepEqual(readLine({ articles: RUNNING, artworks: STOPPED }, TODAY), {
      after: '',
      before: '',
      link: 'Čtení odpovědí k\u00a0obrazovým dílům teď neběží.',
    })
    assert.deepEqual(readLine({ articles: STOPPED, artworks: NEVER }, TODAY), {
      after: '',
      before: '',
      link: 'Čtení odpovědí u\u00a0článků teď neběží.',
    })
    assert.deepEqual(readLine(both(STOPPED), TODAY), {
      after: '',
      before: '',
      link: 'Čtení odpovědí u\u00a0článků i\u00a0obrazových děl teď neběží.',
    })
    assert.deepEqual(readLine({ articles: RUNNING, artworks: NEVER }, TODAY), {
      after: ' se zatím neohlásila.',
      before: 'Úloha ',
      link: 'Odpovědi k\u00a0obrazovým dílům',
    })
    assert.deepEqual(readLine({ articles: NEVER, artworks: RUNNING }, TODAY), {
      after: ' se zatím neohlásila.',
      before: 'Úloha ',
      link: 'Žádosti a\u00a0odpovědi u\u00a0článků',
    })
    assert.deepEqual(readLine(both(NEVER), TODAY), {
      after: '',
      before: '',
      link: 'Žádná z\u00a0úloh pro čtení odpovědí se zatím neohlásila.',
    })
  })

  it('gives the older of two runs, and an estimate only when both jobs share it', () => {
    let later: JobHealth = {
      kind: 'running',
      lastStartedAt: LAST.add({ minutes: 12 }),
      next: NEXT.add({ minutes: 10 }),
    }
    assert.deepEqual(readLine({ articles: later, artworks: RUNNING }, TODAY), {
      after: '',
      before: 'Odpovědi čteny v\u00a09:00',
      link: null,
    })
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
