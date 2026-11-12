import type { Location } from 'react-router'
import { describe, expect, test } from 'vitest'

import { getScrollRestorationKey } from './get-scroll-restoration-key'
import { createNavigationTrailStore } from './navigation-trail-store'

const location = (overrides: Partial<Location>): Location => ({
  hash: '',
  key: 'n1',
  pathname: '/articles',
  search: '?page=3',
  state: null,
  ...overrides,
})

const createStore = () =>
  createNavigationTrailStore({ readStorage: () => null })

describe('getScrollRestorationKey', () => {
  test('keys an ordinary entry by its own key', () => {
    expect(getScrollRestorationKey(location({}), createStore())).toBe('n1')
  })

  test('keys a link up by the list it returns to', () => {
    expect(
      getScrollRestorationKey(
        location({ state: { returnTo: 'l1' } }),
        createStore(),
      ),
    ).toBe('l1')
  })

  test('keys an entry recorded as a return by its return key', () => {
    const store = createStore()

    store.set('n1', { returnKey: 'l1', trail: [] })

    expect(getScrollRestorationKey(location({}), store)).toBe('l1')
  })

  test('follows a return to a list that was itself reached by a return', () => {
    const store = createStore()

    store.set('l2', { returnKey: 'l1', trail: [] })
    store.set('l3', { returnKey: 'l2', trail: [] })

    expect(
      getScrollRestorationKey(location({ state: { returnTo: 'l2' } }), store),
    ).toBe('l1')
    expect(getScrollRestorationKey(location({ key: 'l3' }), store)).toBe('l1')
  })

  test('stops on a loop of returns', () => {
    const store = createStore()

    store.set('a', { returnKey: 'b', trail: [] })
    store.set('b', { returnKey: 'a', trail: [] })

    expect(['a', 'b']).toContain(
      getScrollRestorationKey(location({ key: 'a' }), store),
    )
  })

  test('keys the redirect a delete asked for by the trail entry it lands on', () => {
    const store = createStore()

    store.set('a1', {
      trail: [{ key: 'l1', pathname: '/articles', search: '?page=3' }],
    })
    store.setCurrentKey('a1')

    // Not asked for, as a list's default saved filter: no return.
    expect(
      getScrollRestorationKey(
        location({ state: { _isRedirect: true } }),
        store,
      ),
    ).toBe('n1')

    store.expectRedirect('/articles?page=3')

    expect(
      getScrollRestorationKey(
        location({ state: { _isRedirect: true } }),
        store,
      ),
    ).toBe('l1')
    expect(
      getScrollRestorationKey(
        location({ search: '', state: { _isRedirect: true } }),
        store,
      ),
    ).toBe('n1')
  })
})
