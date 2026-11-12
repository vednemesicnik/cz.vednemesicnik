// @vitest-environment jsdom
import { describe, expect, test } from 'vitest'

import { createInputModalityStore } from './input-modality-store'

describe('createInputModalityStore', () => {
  test('knows nothing before any input', () => {
    expect(createInputModalityStore().read()).toBeNull()
  })

  test('remembers the last kind of input while it tracks', () => {
    const store = createInputModalityStore()
    const stopTracking = store.startTracking()

    document.dispatchEvent(new Event('pointerdown'))
    expect(store.read()).toBe('pointer')

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }))
    expect(store.read()).toBe('keyboard')

    stopTracking()
    document.dispatchEvent(new Event('pointerdown'))
    expect(store.read()).toBe('keyboard')
  })
})
