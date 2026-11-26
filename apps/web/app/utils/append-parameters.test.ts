import { describe, expect, test } from 'vitest'

import { appendParameters } from '~/utils/append-parameters'

describe('append-parameters', () => {
  test('should append parameters to the given route', () => {
    const route = '/example'
    const parameters = 'key=value'
    const result = appendParameters(route, parameters)
    expect(result).toBe(`${route}?${parameters}`)
  })
  test('should not append parameters if none are provided', () => {
    const route = '/example'
    const result = appendParameters(route, '')
    expect(result).toBe(route)
  })
})
