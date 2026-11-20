import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import {
  checkIssueName,
  EMPTY_NAME_MESSAGE,
  type Issue,
  isInFilter,
  issueFilterSearch,
  issueNameKey,
  issueState,
  LONG_NAME_MESSAGE,
  missingFolders,
  parseIssueFilter,
  phoneRowLine,
  rowSubtitle,
  detailStartedLine,
  suggestNextName,
  unfinishedText,
  articleCount,
  artworkCount,
  otherFilterText,
} from './issue.ts'

const NOVEMBER = Temporal.Instant.from('2026-11-14T09:00:00Z')
const JANUARY = Temporal.Instant.from('2027-01-05T09:00:00Z')

function issue(overrides: Partial<Issue> = {}): Issue {
  return {
    closedAt: null,
    completedAt: NOVEMBER,
    folderIds: { articles: 'f-articles', issue: 'f-issue', print: 'f-print' },
    id: 1,
    name: 'VDM_2026_6',
    startedAt: NOVEMBER,
    startedByEmail: 'marie@vednemesicnik.test',
    startedByName: 'Marie Horáková',
    ...overrides,
  }
}

describe('an issue name (11d)', () => {
  it('is trimmed, refused empty and refused over 100 characters', () => {
    assert.deepEqual(checkIssueName('  VDM_2026_6 '), { name: 'VDM_2026_6', ok: true })
    assert.deepEqual(checkIssueName('   '), { message: EMPTY_NAME_MESSAGE, ok: false })
    assert.deepEqual(checkIssueName('x'.repeat(101)), { message: LONG_NAME_MESSAGE, ok: false })
    assert.deepEqual(checkIssueName('č'.repeat(100)).ok, true)
  })

  it('takes any form, the hint being only a hint', () => {
    assert.equal(checkIssueName('Zvláštní vydání 2026').ok, true)
  })

  it('is compared without case, surrounding spaces or how an accent was encoded', () => {
    assert.equal(issueNameKey(' vdm_2026_5 '), issueNameKey('VDM_2026_5'))
    assert.equal(issueNameKey('Zvla\u0301s\u030Ctni\u0301'), issueNameKey('Zvláštní'))
  })
})

describe('the suggested name', () => {
  it('is one above the last issue of this year', () => {
    assert.equal(
      suggestNextName(['VDM_2026_4', 'VDM_2026_5', 'VDM_2025_9'], NOVEMBER),
      'VDM_2026_6',
    )
  })

  it('starts at 1 in a new year', () => {
    assert.equal(suggestNextName(['VDM_2026_4'], JANUARY), 'VDM_2027_1')
  })

  it('is empty while no issue the app knows is numbered', () => {
    assert.equal(suggestNextName([], NOVEMBER), '')
    assert.equal(suggestNextName(['Zvláštní vydání'], NOVEMBER), '')
  })

  it('ignores a special name beside numbered ones', () => {
    assert.equal(suggestNextName(['VDM_2026_2', 'Zvláštní vydání'], NOVEMBER), 'VDM_2026_3')
  })
})

describe('the state and the filter (01c, 11a)', () => {
  it('reads the state from the times', () => {
    assert.equal(issueState(issue()), 'active')
    assert.equal(issueState(issue({ completedAt: null })), 'unfinished')
    assert.equal(issueState(issue({ closedAt: NOVEMBER })), 'closed')
  })

  it('puts the unfinished issue under open', () => {
    assert.equal(isInFilter('unfinished', 'open'), true)
    assert.equal(isInFilter('active', 'open'), true)
    assert.equal(isInFilter('closed', 'open'), false)
    assert.equal(isInFilter('closed', 'closed'), true)
    assert.equal(isInFilter('unfinished', 'closed'), false)
  })

  it('takes anything unknown as all', () => {
    assert.equal(parseIssueFilter(null), 'all')
    assert.equal(parseIssueFilter('active'), 'all')
    assert.equal(parseIssueFilter('open'), 'open')
    assert.equal(parseIssueFilter('closed'), 'closed')
  })

  it('writes the filter into an address back to the overview, and all as nothing', () => {
    assert.equal(issueFilterSearch('all'), '')
    assert.equal(issueFilterSearch('open'), '?state=open')
    assert.equal(issueFilterSearch('closed'), '?state=closed')
  })
})

describe('what an unfinished issue lacks (11d, 12i)', () => {
  it('names only the missing folders', () => {
    let both = issue({ completedAt: null, folderIds: { articles: null, issue: 'f', print: null } })
    assert.deepEqual(missingFolders(both), ['articles', 'print'])
    assert.equal(
      unfinishedText(missingFolders(both)),
      'Zvolte Dokončit vydání. Doplní se chybějící složky Články a\u00a0podklady pro tisk; složka vydání už vznikla.',
    )
    assert.equal(
      unfinishedText(['print']),
      'Zvolte Dokončit vydání. Doplní se chybějící složka podklady pro tisk; složka vydání už vznikla.',
    )
  })

  it('keeps to the step when every folder is stored and only the record is missing', () => {
    assert.equal(unfinishedText([]), 'Zvolte Dokončit vydání.')
  })

  it('does not claim the issue folder exists when it does not', () => {
    assert.equal(
      unfinishedText(['issue', 'articles', 'print']),
      'Zvolte Dokončit vydání. Doplní se chybějící složky vydání, Články a\u00a0podklady pro tisk.',
    )
  })
})

describe('the lines of an issue', () => {
  it('says založení zahájeno until the issue is finished', () => {
    assert.equal(rowSubtitle(issue({ completedAt: null })), 'založení zahájeno 14. 11. 2026')
    assert.equal(rowSubtitle(issue()), 'založeno 14. 11. 2026')
    assert.equal(
      rowSubtitle(issue({ closedAt: Temporal.Instant.from('2026-12-01T09:00:00Z') })),
      'uzavřeno 1. 12. 2026',
    )
  })

  it('names who started it in the detail', () => {
    assert.equal(detailStartedLine(issue()), 'Založeno 14. 11. 2026 · Marie Horáková')
    assert.equal(
      detailStartedLine(issue({ completedAt: null })),
      'Založení zahájeno 14. 11. 2026 · Marie Horáková',
    )
  })

  it('counts in Czech on a phone', () => {
    assert.equal(phoneRowLine(issue(), 0, 0), '0 článků · 0 děl')
    assert.equal(articleCount(1), '1 článek')
    assert.equal(articleCount(3), '3 články')
    assert.equal(artworkCount(1), '1 dílo')
    assert.equal(artworkCount(4), '4 díla')
    assert.equal(artworkCount(11), '11 děl')
    assert.equal(phoneRowLine(issue({ completedAt: null }), 0, 0), 'založení zahájeno 14. 11. 2026')
  })

  it('does not decline vydání', () => {
    assert.equal(otherFilterText(2), 'Filtr Vše ukáže 2 vydání.')
  })
})
