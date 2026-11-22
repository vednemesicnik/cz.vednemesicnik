import { describe, expect, test } from 'vitest'

import { addDefaultCharset } from './add-default-charset.ts'

const typeOf = (contentType: string) =>
  addDefaultCharset(
    new Response('', { headers: { 'Content-Type': contentType } }),
  ).headers.get('Content-Type')

describe('addDefaultCharset', () => {
  test.each([
    ['text/html', 'text/html; charset=utf-8'],
    ['text/x-script', 'text/x-script; charset=utf-8'],
    ['application/json', 'application/json; charset=utf-8'],
  ])('adds the charset to %s', (contentType, expected) => {
    expect(typeOf(contentType)).toBe(expected)
  })

  test.each(['text/html; charset=iso-8859-2', 'image/png', 'application/pdf'])(
    'leaves %s alone',
    (contentType) => {
      expect(typeOf(contentType)).toBe(contentType)
    },
  )

  test('leaves a response without a type alone', () => {
    const response = new Response(null, { status: 204 })

    expect(addDefaultCharset(response).headers.get('Content-Type')).toBeNull()
  })

  test('copies a fetched response, whose headers are immutable', async () => {
    const fetched = await fetch('data:text/html,<p>ok</p>')

    const response = addDefaultCharset(fetched)

    expect(response).not.toBe(fetched)
    expect(response.headers.get('Content-Type')).toBe(
      'text/html; charset=utf-8',
    )
    expect(await response.text()).toBe('<p>ok</p>')
  })
})
