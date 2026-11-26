import { describe, expect, test, vi } from 'vitest'

import { createNavigationTrailStore } from './navigation-trail-store'

const createStorage = (): Storage => {
  const items = new Map<string, string>()

  return {
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    get length() {
      return items.size
    },
    removeItem: (key) => {
      items.delete(key)
    },
    setItem: (key, value) => {
      items.set(key, value)
    },
  }
}

const record = { trail: [{ key: 'l1', pathname: '/articles', search: '' }] }

describe('createNavigationTrailStore', () => {
  test('keeps a record by its entry key, and a new store on the same storage reads it again', () => {
    const storage = createStorage()

    createNavigationTrailStore({ readStorage: () => storage }).set('a1', record)

    expect(
      createNavigationTrailStore({ readStorage: () => storage }).get('a1'),
    ).toEqual(record)
  })

  test('works in memory without storage', () => {
    const store = createNavigationTrailStore({ readStorage: () => null })

    store.set('a1', record)
    expect(store.get('a1')).toEqual(record)
  })

  test('starts again on an unreadable copy', () => {
    const storage = createStorage()

    storage.setItem('navigation-trail', '{not json')

    expect(
      createNavigationTrailStore({ readStorage: () => storage }).get('a1'),
    ).toBeUndefined()
  })

  test('drops the oldest entries past a hundred', () => {
    const store = createNavigationTrailStore({ readStorage: () => null })

    for (let index = 0; index < 101; index++) store.set(`k${index}`, record)

    expect(store.get('k0')).toBeUndefined()
    expect(store.get('k1')).toEqual(record)
    expect(store.get('k100')).toEqual(record)
  })

  test('tells its listeners of a record until they unsubscribe', () => {
    const store = createNavigationTrailStore({ readStorage: () => null })
    const listener = vi.fn()
    const unsubscribe = store.subscribe(listener)

    store.set('a1', record)
    unsubscribe()
    store.set('a2', record)

    expect(listener).toHaveBeenCalledTimes(1)
  })

  test('holds the redirect a delete asked for until it is cleared', () => {
    const store = createNavigationTrailStore({ readStorage: () => null })

    expect(store.readExpectedRedirect()).toBeNull()
    store.expectRedirect('/administration/articles?q=ples')
    expect(store.readExpectedRedirect()).toBe('/administration/articles?q=ples')
    store.clearExpectedRedirect()
    expect(store.readExpectedRedirect()).toBeNull()
  })

  test('knows the entry on screen', () => {
    const store = createNavigationTrailStore({ readStorage: () => null })

    expect(store.readCurrentKey()).toBeNull()
    store.setCurrentKey('a1')
    expect(store.readCurrentKey()).toBe('a1')
  })
})
