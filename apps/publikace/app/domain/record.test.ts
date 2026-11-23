import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import type { FinalVersion } from './article.ts'
import { countClauses } from './approvals.ts'
import {
  ARTICLES_LIST,
  articleRows,
  ARTWORKS_LIST,
  isFullRewriteDue,
  artworkRows,
  batchStatus,
  CLAUSES_LIST,
  clauseRows,
  type RecordBatch,
  type RecordClause,
  REGISTRY_LIST,
  registryRows,
  retryDelay,
  serialDate,
  spreadsheetUrl,
} from './record.ts'

const AT = Temporal.Instant.from('2026-11-23T10:30:00Z')
const LATER = Temporal.Instant.from('2026-11-24T08:00:00Z')

describe('the record’s dates', () => {
  it('are Sheets serial numbers of the time in Prague', () => {
    // 23 Nov 2026 11:30 in Prague; 1 Jan 1970 is 25569.
    let expected = Date.UTC(2026, 10, 23, 11, 30) / 1000 / 86_400 + 25_569
    assert.equal(serialDate(AT), expected)
  })

  it('follow summer time', () => {
    let summer = Temporal.Instant.from('2026-07-01T10:00:00Z')
    assert.equal(serialDate(summer), Date.UTC(2026, 6, 1, 12) / 1000 / 86_400 + 25_569)
  })
})

describe('the Registr list', () => {
  it('is the app’s own list, never the scripts’ Vydání', () => {
    assert.equal(REGISTRY_LIST.name, 'Vydání z aplikace')
    assert.notEqual(REGISTRY_LIST.name, 'Vydání')
  })

  it('writes an issue in the scripts’ columns, active while it is open', () => {
    let rows = registryRows(
      [
        {
          articleLinkKey: 'Qe7pRz2mX4kc',
          evidenceId: 'sheet-1',
          folderId: 'folder-1',
          isClosed: false,
          name: 'VDM_2026_7',
          startedAt: AT,
        },
        {
          articleLinkKey: null,
          evidenceId: null,
          folderId: 'folder-2',
          isClosed: true,
          name: 'VDM_2026_8',
          startedAt: AT,
        },
      ],
      'https://publikace.vednemesicnik.test',
    )
    assert.deepEqual(rows[0], [
      'VDM_2026_7',
      'folder-1',
      'sheet-1',
      true,
      'https://publikace.vednemesicnik.test/l/Qe7pRz2mX4kc/article',
      serialDate(AT),
      '',
    ])
    assert.deepEqual(rows[1]?.slice(0, 5), ['VDM_2026_8', 'folder-2', '', false, ''])
    assert.equal(rows[0]?.length, REGISTRY_LIST.headers.length)
  })
})

function finalVersion(clauses: Parameters<typeof countClauses>[0]): FinalVersion {
  return {
    at: LATER,
    authors: [],
    clauses: countClauses(clauses),
    docRevisedAt: null,
    email: 'korektor@vednemesicnik.test',
    isCancellable: false,
    isReplacement: false,
    name: null,
    pdfFileId: 'pdf-1',
    reviewAuthor: null,
  }
}

describe('Články', () => {
  let base = {
    authors: [{ name: 'Klára Šimková' }, { name: 'Petr Malý' }],
    createdAt: AT,
    docId: 'doc-1',
    finalVersion: null,
    handover: null,
    name: '=Úvodník',
    proofreading: null,
  }

  it('names the state as the Evidence does, with Dopsáno for the handover', () => {
    let step = { at: LATER, email: 'sefredaktor@vednemesicnik.test', name: null }
    let marked = finalVersion([
      {
        approvedAt: null,
        archiveFailedAt: null,
        consentVerifiedAt: null,
        isExactConsent: false,
        replyMessageId: null,
        state: 'sent',
      },
    ])
    let rows = articleRows([
      base,
      { ...base, handover: step },
      { ...base, proofreading: { ...step, name: 'Jana Korektorová' } },
      { ...base, finalVersion: marked },
    ])
    assert.deepEqual(
      rows.map((row) => row[4]),
      ['Rozpracováno', 'Dopsáno', 'Korektura probíhá', 'K finalizaci'],
    )
    assert.equal(rows[2]?.[7], 'Jana Korektorová')
    assert.equal(rows[3]?.[8], serialDate(LATER))
  })

  it('keeps a name as typed, joins the authors and fills every column', () => {
    let [row] = articleRows([base])
    assert.equal(row?.[0], '=Úvodník')
    assert.equal(row?.[1], 'https://docs.google.com/document/d/doc-1/edit')
    assert.equal(row?.[3], 'Klára Šimková, Petr Malý')
    assert.equal(row?.length, ARTICLES_LIST.headers.length)
    assert.equal(row?.[9], serialDate(AT))
  })
})

describe('Redakční doložky', () => {
  let clause: RecordClause = {
    approvedAt: null,
    archiveError: null,
    archiveFailedAt: null,
    articleName: 'Úvodník',
    authorEmail: 'klara.simkova@external.test',
    authorName: 'Klára Šimková',
    clauseKey: 'clause_12_1_20261124080000000',
    consentVerifiedAt: null,
    docId: 'doc-1',
    error: null,
    isExactConsent: false,
    licencesFolderId: 'licences-1',
    markedAt: LATER,
    pdfFileId: 'pdf-1',
    pdfHash: 'a'.repeat(64),
    position: 1,
    replyMessageId: null,
    replyReceivedAt: null,
    replyThreadId: null,
    sentAt: null,
    state: 'pending',
  }

  it('names each state as the old job does', () => {
    let rows = clauseRows([
      clause,
      { ...clause, position: 2, sentAt: LATER, state: 'sent' },
      { ...clause, position: 3, replyMessageId: 'm', replyThreadId: 't', state: 'sent' },
      { ...clause, isExactConsent: true, position: 4, replyMessageId: 'm', state: 'sent' },
      { ...clause, error: 'Mailer timeout', position: 5, state: 'failed' },
    ])
    assert.deepEqual(
      rows.map((row) => row[5]),
      ['K odeslání', 'Čeká na odpověď', 'Odpověď ke kontrole', 'Souhlas k archivaci', 'Chyba'],
    )
    assert.equal(rows[2]?.[7], 'https://mail.google.com/mail/#all/t')
    assert.equal(rows[4]?.[12], 'Mailer timeout')
  })

  it('links the licence folder only once the consent is archived', () => {
    let [waiting, approved] = clauseRows([
      { ...clause, state: 'sent' },
      { ...clause, approvedAt: LATER, position: 2, replyMessageId: 'm', state: 'sent' },
    ])
    assert.equal(waiting?.[8], '')
    assert.equal(approved?.[5], 'Souhlas udělen')
    assert.equal(approved?.[8], 'https://drive.google.com/drive/folders/licences-1')
    assert.equal(approved?.length, CLAUSES_LIST.headers.length)
  })

  it('orders by marking, then by author', () => {
    let rows = clauseRows([
      { ...clause, markedAt: LATER, position: 2 },
      { ...clause, markedAt: AT },
    ])
    assert.deepEqual(
      rows.map((row) => row[0]),
      [serialDate(AT), serialDate(LATER)],
    )
  })
})

describe('Obrazová díla', () => {
  let batch: RecordBatch = {
    approvedAt: null,
    archiveError: null,
    archiveFailedAt: null,
    articleFolderId: 'article-1',
    articleName: 'Úvodník',
    artworks: [
      { author: 'Petr Malý', source: null, storedName: 'b1.jpg' },
      { author: null, source: 'https://external.test/foto', storedName: 'b2.png' },
    ],
    consentVerifiedAt: null,
    createdAt: AT,
    discardedAt: null,
    isExactConsent: false,
    licencesFolderId: 'licences-1',
    mailFailedAt: null,
    mailRefusedAt: null,
    mailSentAt: AT,
    providerEmail: 'petr.maly@external.test',
    providerName: 'Petr Malý',
    replyMessageId: null,
    replyReceivedAt: null,
    replyText: null,
    replyThreadId: null,
    tag: '20261123T103000',
  }

  it('splits U poskytovatele the way the reply check sees it', () => {
    assert.equal(batchStatus(batch), 'Čeká na odpověď')
    assert.equal(
      batchStatus({ ...batch, isExactConsent: true, replyMessageId: 'm' }),
      'Souhlas k archivaci',
    )
    assert.equal(batchStatus({ ...batch, replyMessageId: 'm' }), 'Odpověď ke kontrole')
    assert.equal(batchStatus({ ...batch, mailSentAt: null }), 'Chyba')
    assert.equal(
      batchStatus({ ...batch, approvedAt: LATER, replyMessageId: 'm' }),
      'Souhlas udělen',
    )
  })

  it('writes one row per artwork, with its own author, source and file', () => {
    let rows = artworkRows([batch])
    assert.equal(rows.length, 2)
    assert.deepEqual(rows[0]?.slice(1, 8), [
      'Úvodník',
      'article-1',
      'Petr Malý',
      'petr.maly@external.test',
      'Petr Malý',
      '',
      'Čeká na odpověď',
    ])
    assert.equal(rows[1]?.[6], 'https://external.test/foto')
    assert.equal(rows[1]?.[11], '20261123T103000')
    assert.equal(rows[1]?.[13], 'b2.png')
    assert.equal(rows[1]?.length, ARTWORKS_LIST.headers.length)
  })
})

describe('Otevřít Evidenci', () => {
  it('opens the spreadsheet', () => {
    assert.equal(spreadsheetUrl('sheet-1'), 'https://docs.google.com/spreadsheets/d/sheet-1/edit')
  })
})

describe('the record queue', () => {
  it('waits longer after each failure, an hour at most', () => {
    assert.deepEqual(
      [1, 2, 3, 6, 9].map((attempts) => retryDelay(attempts).total('minutes')),
      [2, 4, 8, 60, 60],
    )
  })

  it('rewrites everything a day after the last time, or when it never did', () => {
    assert.equal(isFullRewriteDue(null, AT), true)
    assert.equal(isFullRewriteDue(AT, AT.add({ hours: 23 })), false)
    assert.equal(isFullRewriteDue(AT, AT.add({ hours: 24 })), true)
  })
})
