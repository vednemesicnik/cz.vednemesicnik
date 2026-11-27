import { describe, expect, test, vi } from 'vitest'

import { createPublikaceErrorReporter } from './report-publikace-error.ts'

describe('createPublikaceErrorReporter', () => {
  test('captures the error tagged as Publikace and its area', () => {
    const capture = vi.fn()
    const error = new Error('the Registr was not written')

    createPublikaceErrorReporter(capture)(error, 'record')

    expect(capture).toHaveBeenCalledExactlyOnceWith(error, {
      tags: { app: 'publikace', area: 'record' },
    })
  })

  test('wraps a thrown value that is not an Error', () => {
    const capture = vi.fn()

    createPublikaceErrorReporter(capture)('busy', 'request')

    expect(capture).toHaveBeenCalledExactlyOnceWith(new Error('busy'), {
      tags: { app: 'publikace', area: 'request' },
    })
  })
})
