// @vitest-environment jsdom
import { afterEach, describe, expect, test } from 'vitest'

import { isSpaceToClose } from './is-space-to-close'

const createViewer = ({ captionScrolls }: { captionScrolls: boolean }) => {
  const dialog = document.createElement('dialog')
  dialog.innerHTML =
    '<button type="button">×</button><figure><figcaption><a href="/">odkaz</a></figcaption></figure>'
  document.body.append(dialog)

  const caption = dialog.querySelector('figcaption') as HTMLElement
  // jsdom lays nothing out: the caption's heights say whether it scrolls.
  Object.defineProperty(caption, 'clientHeight', { value: 100 })
  Object.defineProperty(caption, 'scrollHeight', {
    value: captionScrolls ? 300 : 100,
  })

  return {
    button: dialog.querySelector('button') as HTMLElement,
    caption,
    dialog,
    link: dialog.querySelector('a') as HTMLElement,
  }
}

const space = (
  target: EventTarget,
  modifiers: Partial<KeyboardEvent> = {},
) => ({
  altKey: false,
  ctrlKey: false,
  key: ' ',
  metaKey: false,
  shiftKey: false,
  target,
  ...modifiers,
})

afterEach(() => {
  document.body.replaceChildren()
})

describe('isSpaceToClose', () => {
  test('Space on the dialog itself closes', () => {
    const { dialog } = createViewer({ captionScrolls: false })

    expect(isSpaceToClose(space(dialog))).toBe(true)
  })

  test('Space on a button presses the button instead', () => {
    const { button } = createViewer({ captionScrolls: false })

    expect(isSpaceToClose(space(button))).toBe(false)
  })

  test('Space with a modifier, or another key, does nothing', () => {
    const { dialog } = createViewer({ captionScrolls: false })

    expect(isSpaceToClose(space(dialog, { shiftKey: true }))).toBe(false)
    expect(isSpaceToClose(space(dialog, { metaKey: true }))).toBe(false)
    expect(isSpaceToClose(space(dialog, { key: 'Enter' }))).toBe(false)
  })

  test('Space on a link in a caption that fits closes', () => {
    const { link } = createViewer({ captionScrolls: false })

    expect(isSpaceToClose(space(link))).toBe(true)
  })

  test('Space in a caption that scrolls keeps scrolling it', () => {
    const { caption, link } = createViewer({ captionScrolls: true })

    expect(isSpaceToClose(space(caption))).toBe(false)
    expect(isSpaceToClose(space(link))).toBe(false)
  })
})
