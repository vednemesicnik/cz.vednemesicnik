import { describe, expect, test } from 'vitest'

import type { TrailEntry } from './navigation-trail-entry'
import { recordNavigation } from './record-navigation'

const list: TrailEntry = { key: 'l1', pathname: '/articles', search: '?page=3' }
const article: TrailEntry = {
  key: 'a1',
  pathname: '/articles/ples',
  search: '',
}
const home: TrailEntry = { key: 'h1', pathname: '/', search: '' }

const at = (pathname: string, search = '', state: unknown = null) => ({
  pathname,
  search,
  state,
})

describe('recordNavigation', () => {
  test('leaves nothing new on Back and Forward', () => {
    expect(
      recordNavigation({
        navigationType: 'POP',
        next: at('/articles'),
        previous: article,
        previousTrail: [list],
      }),
    ).toBeNull()
  })

  test('puts the page left at the head of the trail', () => {
    expect(
      recordNavigation({
        navigationType: 'PUSH',
        next: at('/articles/ples'),
        previous: list,
        previousTrail: [home],
      }),
    ).toEqual({ trail: [list, home] })
  })

  test('keeps the trail on another page of the same list and on a replace', () => {
    const sameList = recordNavigation({
      navigationType: 'PUSH',
      next: at('/articles', '?page=4'),
      previous: list,
      previousTrail: [home],
    })
    const replaced = recordNavigation({
      navigationType: 'REPLACE',
      next: at('/administration/articles/1/edit-article'),
      previous: {
        key: 'd1',
        pathname: '/administration/articles/1',
        search: '',
      },
      previousTrail: [home],
    })

    expect(sameList).toEqual({ trail: [home] })
    expect(replaced).toEqual({ trail: [home] })
  })

  test('keeps the trail to five entries', () => {
    const trail = ['a', 'b', 'c', 'd', 'e'].map((key) => ({
      key,
      pathname: `/${key}`,
      search: '',
    }))
    const record = recordNavigation({
      navigationType: 'PUSH',
      next: at('/f'),
      previous: { key: 'z', pathname: '/z', search: '' },
      previousTrail: trail,
    })

    expect(record?.trail.map((entry) => entry.key)).toEqual([
      'z',
      'a',
      'b',
      'c',
      'd',
    ])
  })

  test('returns up to the list a link up names, with its trail, key and the record to focus', () => {
    expect(
      recordNavigation({
        navigationType: 'PUSH',
        next: at('/articles', '?page=3', { returnTo: 'l1' }),
        previous: article,
        previousTrail: [list, home],
      }),
    ).toEqual({ focusPath: '/articles/ples', returnKey: 'l1', trail: [home] })
  })

  test('focuses the record a return two levels up came through', () => {
    const detail = {
      key: 'd1',
      pathname: '/administration/articles/1',
      search: '',
    }
    const adminList = {
      key: 'l2',
      pathname: '/administration/articles',
      search: '?q=ples',
    }

    expect(
      recordNavigation({
        navigationType: 'PUSH',
        next: at('/administration/articles', '?q=ples', { returnTo: 'l2' }),
        previous: {
          key: 'e1',
          pathname: '/administration/articles/1/edit-article',
          search: '',
        },
        previousTrail: [detail, adminList],
      }),
    ).toEqual({
      focusPath: '/administration/articles/1',
      returnKey: 'l2',
      trail: [],
    })
  })

  test('takes a redirect onto an address of the trail as a return, as after a delete', () => {
    expect(
      recordNavigation({
        navigationType: 'PUSH',
        next: at('/articles', '?page=3', { _isRedirect: true }),
        previous: article,
        previousTrail: [list],
      }),
    ).toEqual({ focusPath: '/articles/ples', returnKey: 'l1', trail: [] })
  })

  test('takes a redirect elsewhere as any other navigation', () => {
    expect(
      recordNavigation({
        navigationType: 'PUSH',
        next: at('/articles', '', { _isRedirect: true }),
        previous: article,
        previousTrail: [list],
      }),
    ).toEqual({ trail: [article, list] })
  })
})
