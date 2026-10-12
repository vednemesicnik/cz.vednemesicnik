import { describe, expect, test } from 'vitest'

import { formatRoleChangeDetail } from '~/utils/format-role-change-detail'

import { toAccountHistoryEntry } from './to-account-history-entry'

const createdAt = new Date('2026-02-03T09:05:00.000Z')

describe('toAccountHistoryEntry', () => {
  test('labels the account creation', () => {
    expect(
      toAccountHistoryEntry(
        { createdAt, detail: null, event: 'user_created', id: 'row' },
        'Petr Dvořák',
      ),
    ).toEqual({
      actorName: 'Petr Dvořák',
      dateTime: '2026-02-03T09:05:00.000Z',
      formattedDateTime: '3. 2. 2026, 10:05',
      id: 'row',
      label: 'Účet založen',
    })
  })

  test('names a user role change in Czech, the new role first', () => {
    expect(
      toAccountHistoryEntry(
        {
          createdAt,
          detail: formatRoleChangeDetail('member', 'administrator'),
          event: 'user_role_changed',
          id: 'row',
        },
        'Petr Dvořák',
      )?.label,
    ).toBe('Uživatelská role: Administrátor, dříve Člen')
  })

  test('names an author role change in Czech', () => {
    expect(
      toAccountHistoryEntry(
        {
          createdAt,
          detail: formatRoleChangeDetail('contributor', 'creator'),
          event: 'author_role_changed',
          id: 'row',
        },
        'Petr Dvořák',
      )?.label,
    ).toBe('Autorská role: Tvůrce, dříve Přispěvatel')
  })

  test('keeps only the prefix for a detail it cannot read', () => {
    expect(
      toAccountHistoryEntry(
        {
          createdAt,
          detail: 'role: member → janitor',
          event: 'user_role_changed',
          id: 'row',
        },
        null,
      )?.label,
    ).toBe('Uživatelská role')
  })

  test('labels every emergency link issued', () => {
    expect(
      toAccountHistoryEntry(
        { createdAt, detail: null, event: 'emergency_link_issued', id: 'row' },
        'Petr Dvořák',
      )?.label,
    ).toBe('Nouzový odkaz vydán')
  })

  test('leaves out a deletion', () => {
    expect(
      toAccountHistoryEntry(
        { createdAt, detail: null, event: 'user_deleted', id: 'row' },
        null,
      ),
    ).toBeNull()
  })
})
