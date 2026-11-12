// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, test } from 'vitest'

import { navigationTrailStore } from '~/utils/navigation-trail/navigation-trail-store'

import { ParentLink } from './_component'

afterEach(() => {
  cleanup()
})

const renderAt = (key: string) =>
  render(
    <MemoryRouter initialEntries={[{ key, pathname: '/articles/ples' }]}>
      <ParentLink to={'/articles'}>Články</ParentLink>
    </MemoryRouter>,
  )

describe('ParentLink', () => {
  test('leads back to the list page the article was opened from', () => {
    navigationTrailStore.set('from-list', {
      trail: [{ key: 'l1', pathname: '/articles', search: '?page=3' }],
    })

    renderAt('from-list')

    expect(
      screen.getByRole('link', { name: 'Články' }).getAttribute('href'),
    ).toBe('/articles?page=3')
  })

  test('leads to the bare parent when the article was opened from elsewhere', () => {
    navigationTrailStore.set('from-category', {
      trail: [
        { key: 'c1', pathname: '/articles/categories/kultura', search: '' },
      ],
    })

    renderAt('from-category')

    expect(
      screen.getByRole('link', { name: 'Články' }).getAttribute('href'),
    ).toBe('/articles')
  })

  test('leads to the bare parent without a trail', () => {
    renderAt('unknown')

    expect(
      screen.getByRole('link', { name: 'Články' }).getAttribute('href'),
    ).toBe('/articles')
  })
})
