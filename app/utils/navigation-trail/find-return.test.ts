import { describe, expect, test } from 'vitest'

import { findReturn } from './find-return'

const list = { key: 'l1', pathname: '/articles', search: '?page=3' }

describe('findReturn', () => {
  test('finds the list the record was opened from', () => {
    expect(findReturn([list], '/articles', '/articles/ples')).toEqual({
      entry: list,
      index: 0,
    })
  })

  test('walks up through the record’s own pages: detail, then list', () => {
    const detail = {
      key: 'd1',
      pathname: '/administration/articles/1',
      search: '',
    }
    const adminList = {
      key: 'l2',
      pathname: '/administration/articles',
      search: '?state=pending',
    }

    expect(
      findReturn(
        [detail, adminList],
        '/administration/articles',
        '/administration/articles/1/edit-article',
      ),
    ).toEqual({ entry: adminList, index: 1 })
  })

  test('finds nothing for a record reached from another record', () => {
    const other = { key: 'a0', pathname: '/articles/jiny', search: '' }

    expect(findReturn([other, list], '/articles', '/articles/ples')).toBeNull()
  })

  test('finds nothing for a record opened from a category, home or nowhere', () => {
    const category = {
      key: 'c1',
      pathname: '/articles/categories/kultura',
      search: '',
    }

    expect(findReturn([category], '/articles', '/articles/ples')).toBeNull()
    expect(
      findReturn(
        [{ key: 'h', pathname: '/', search: '' }],
        '/articles',
        '/articles/ples',
      ),
    ).toBeNull()
    expect(findReturn([], '/articles', '/articles/ples')).toBeNull()
  })

  test('walks through the record’s edit page below it, as after Zavřít', () => {
    const edit = {
      key: 'e1',
      pathname: '/administration/articles/1/edit-article',
      search: '',
    }
    const adminList = {
      key: 'l2',
      pathname: '/administration/articles',
      search: '?q=ples',
    }

    expect(
      findReturn(
        [edit, adminList],
        '/administration/articles',
        '/administration/articles/1',
      ),
    ).toEqual({ entry: adminList, index: 1 })
  })

  test('finds the nearest page above without a target', () => {
    const edit = {
      key: 'e1',
      pathname: '/administration/articles/1/edit-article',
      search: '',
    }
    const adminList = {
      key: 'l2',
      pathname: '/administration/articles',
      search: '?q=ples',
    }

    expect(
      findReturn([edit, adminList], null, '/administration/articles/1'),
    ).toEqual({ entry: adminList, index: 1 })
    expect(findReturn([edit], null, '/administration/articles/1')).toBeNull()
  })

  test('never leads a page to itself', () => {
    expect(findReturn([list], '/articles/ples', '/articles/ples')).toBeNull()
  })
})
