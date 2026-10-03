import { describe, expect, test } from 'vitest'

import type { AuthorPermissionContext } from '../context/get-author-permission-context.server'
import {
  type ContentUpdateTarget,
  requireContentUpdatePermission,
} from './require-content-update-permission.server'

type Rights = { view: boolean; update: boolean }

// Minimal context stub: `can()` answers per action.
const makeContext = (rights: Rights) =>
  ({
    authorId: 'me',
    can: ({ action }: { action: 'view' | 'update' }) => ({
      hasAny: rights[action],
      hasOwn: false,
      hasPermission: rights[action],
    }),
  }) as unknown as AuthorPermissionContext

const target = (
  overrides: Partial<ContentUpdateTarget> = {},
): ContentUpdateTarget => ({
  authorIds: ['someone'],
  id: 'a1',
  kind: 'article',
  state: 'draft',
  title: 'Anketa',
  ...overrides,
})

const thrown = (callback: () => unknown) => {
  try {
    callback()
  } catch (error) {
    return error as { data: unknown; init: { status: number } }
  }
  throw new Error('expected a throw')
}

describe('requireContentUpdatePermission', () => {
  test('returns the rights when the edit is allowed', () => {
    expect(
      requireContentUpdatePermission(
        makeContext({ update: true, view: true }),
        target(),
      ),
    ).toEqual({ hasAny: true, hasOwn: false })
  })

  test('a record the person may not view is a 404', () => {
    const error = thrown(() =>
      requireContentUpdatePermission(
        makeContext({ update: false, view: false }),
        target(),
      ),
    )

    expect(error.init.status).toBe(404)
  })

  test('published content gives the published reason', () => {
    const error = thrown(() =>
      requireContentUpdatePermission(
        makeContext({ update: false, view: true }),
        target({ state: 'published' }),
      ),
    )

    expect(error.init.status).toBe(403)
    expect(error.data).toMatchObject({
      actions: [
        { href: '/administration/articles/a1', label: 'Zobrazit článek' },
        { href: '/administration/articles', label: 'Na články' },
      ],
      title: 'Článek „Anketa“ teď upravit nejde',
    })
  })

  test('someone else’s draft gives the foreign-draft reason', () => {
    const error = thrown(() =>
      requireContentUpdatePermission(
        makeContext({ update: false, view: true }),
        target(),
      ),
    )

    expect(error.data).toMatchObject({
      title: 'Článek „Anketa“ upravit nemůžete',
    })
  })

  test('an episode leads back to its podcast', () => {
    const error = thrown(() =>
      requireContentUpdatePermission(
        makeContext({ update: false, view: true }),
        target({ kind: 'episode', podcastId: 'p1', state: 'published' }),
      ),
    )

    expect(error.data).toMatchObject({
      actions: [
        {
          href: '/administration/podcasts/p1/episodes/a1',
          label: 'Zobrazit epizodu',
        },
        { href: '/administration/podcasts/p1', label: 'Na podcast' },
      ],
    })
  })

  test.each([
    ['archived content', target({ state: 'archived' })],
    ['an own draft', target({ authorIds: ['me'] })],
  ])('%s without a drawn reason is the generic 403', (_label, record) => {
    const error = thrown(() =>
      requireContentUpdatePermission(
        makeContext({ update: false, view: true }),
        record,
      ),
    )

    expect(error.init.status).toBe(403)
    expect(error.data).toBeNull()
  })
})
