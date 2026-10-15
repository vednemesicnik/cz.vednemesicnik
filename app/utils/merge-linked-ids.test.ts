import { describe, expect, it } from 'vitest'

import { mergeLinkedIds } from './merge-linked-ids'

describe('mergeLinkedIds', () => {
  it('keeps a stored link the editor did not send', () => {
    expect(
      mergeLinkedIds({
        removedIds: [],
        sentIds: ['culture'],
        storedIds: ['culture', 'archived'],
      }),
    ).toEqual(['culture', 'archived'])
  })

  it('drops a stored link sent as removed', () => {
    expect(
      mergeLinkedIds({
        removedIds: ['archived'],
        sentIds: ['culture'],
        storedIds: ['culture', 'archived'],
      }),
    ).toEqual(['culture'])
  })

  it('adds a picked link, a removed one picked again included', () => {
    expect(
      mergeLinkedIds({
        removedIds: [],
        sentIds: ['culture', 'archived'],
        storedIds: ['culture'],
      }),
    ).toEqual(['culture', 'archived'])
  })

  it('lists each link once', () => {
    expect(
      mergeLinkedIds({
        removedIds: [],
        sentIds: ['culture', 'culture'],
        storedIds: ['culture'],
      }),
    ).toEqual(['culture'])
  })
})
