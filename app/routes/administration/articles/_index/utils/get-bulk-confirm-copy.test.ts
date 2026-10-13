import { describe, expect, test } from 'vitest'

import { getBulkConfirmCopy } from './get-bulk-confirm-copy'

describe('getBulkConfirmCopy', () => {
  test('archives several articles', () => {
    expect(
      getBulkConfirmCopy({ action: 'archive', count: 7, onlyDrafts: false }),
    ).toEqual({
      confirmLabel: 'Archivovat 7 článků',
      description:
        'Čtenáři články na webu neuvidí. V administraci zůstanou mezi archivovanými.',
      title: 'Archivovat 7 článků?',
    })
  })

  test('archives one article', () => {
    expect(
      getBulkConfirmCopy({ action: 'archive', count: 1, onlyDrafts: false })
        .description,
    ).toBe(
      'Čtenáři článek na webu neuvidí. V administraci zůstane mezi archivovanými.',
    )
  })

  test('deletes only drafts as koncepty', () => {
    expect(
      getBulkConfirmCopy({ action: 'delete', count: 3, onlyDrafts: true }),
    ).toEqual({
      confirmLabel: 'Smazat 3 koncepty',
      description: 'Smazání je nevratné.',
      title: 'Smazat 3 koncepty?',
    })
  })

  test('deletes a mixed selection as články', () => {
    expect(
      getBulkConfirmCopy({ action: 'delete', count: 3, onlyDrafts: false })
        .title,
    ).toBe('Smazat 3 články?')
  })
})
