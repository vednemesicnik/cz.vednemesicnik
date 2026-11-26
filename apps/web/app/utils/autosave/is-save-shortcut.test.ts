import { describe, expect, test } from 'vitest'

import { isSaveShortcut } from './is-save-shortcut'

const press = (modifiers: Partial<KeyboardEvent> = {}) => ({
  altKey: false,
  ctrlKey: false,
  key: 's',
  metaKey: false,
  shiftKey: false,
  ...modifiers,
})

describe('isSaveShortcut', () => {
  test('⌘S on a Mac', () => {
    expect(isSaveShortcut(press({ metaKey: true }), 'macOS')).toBe(true)
    expect(isSaveShortcut(press({ metaKey: true }), 'MacIntel')).toBe(true)
  })

  test('⌃S on a Mac is not the shortcut', () => {
    expect(isSaveShortcut(press({ ctrlKey: true }), 'macOS')).toBe(false)
  })

  test('Ctrl+S elsewhere', () => {
    expect(isSaveShortcut(press({ ctrlKey: true }), 'Windows')).toBe(true)
    expect(isSaveShortcut(press({ metaKey: true }), 'Windows')).toBe(false)
  })

  test('Caps Lock still counts; other modifiers and keys do not', () => {
    expect(isSaveShortcut(press({ key: 'S', metaKey: true }), 'macOS')).toBe(
      true,
    )
    expect(
      isSaveShortcut(press({ metaKey: true, shiftKey: true }), 'macOS'),
    ).toBe(false)
    expect(isSaveShortcut(press({ key: 'a', metaKey: true }), 'macOS')).toBe(
      false,
    )
  })
})
