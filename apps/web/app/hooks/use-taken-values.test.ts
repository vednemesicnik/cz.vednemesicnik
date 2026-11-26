// @vitest-environment jsdom
import { cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'

import { useTakenValues } from './use-taken-values'

afterEach(() => {
  cleanup()
})

describe('useTakenValues (log 0039)', () => {
  test('takes what the loader reported, without the empty one', () => {
    const { result } = renderHook(() =>
      useTakenValues(['deset-knih-na-podzim', null]),
    )

    expect(result.current.has('deset-knih-na-podzim')).toBe(true)
    expect(result.current.has('null')).toBe(false)
  })

  test('a value a save reports becomes taken', () => {
    const { result } = renderHook(() => useTakenValues([]))

    result.current.add('deset-knih-na-podzim')

    expect(result.current.has('deset-knih-na-podzim')).toBe(true)
  })

  test('a value nobody reported is free', () => {
    const { result } = renderHook(() =>
      useTakenValues(['deset-knih-na-podzim']),
    )

    expect(result.current.has('deset-knih-na-podzim-2')).toBe(false)
  })

  test('the values only grow: a later render keeps them all', () => {
    const { result, rerender } = renderHook(
      ({ initialValues }) => useTakenValues(initialValues),
      { initialProps: { initialValues: ['deset-knih-na-podzim'] } },
    )

    result.current.add('podzimni-cteni')
    rerender({ initialValues: [] })

    expect(result.current.has('deset-knih-na-podzim')).toBe(true)
    expect(result.current.has('podzimni-cteni')).toBe(true)
  })
})
