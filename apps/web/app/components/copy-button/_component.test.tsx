// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { CopyButton } from './_component'

const ADDRESS = 'https://vednemesicnik.cz/feeds/articles.xml'

const WEB_SENTENCE =
  'Kopírování se nepovedlo. Zkopírujte označený text pomocí Ctrl+C, na Macu ⌘C.'

const mockClipboard = (writeText: () => Promise<void>) => {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: vi.fn(writeText) },
  })
}

const mockFinePointer = (matches: boolean) => {
  window.matchMedia = vi.fn().mockReturnValue({ matches })
}

const selectedText = () => window.getSelection()?.toString()

const clickButton = async () => {
  await act(async () => {
    fireEvent.click(screen.getByRole('button'))
  })
}

beforeEach(() => {
  mockFinePointer(true)
})

afterEach(() => {
  cleanup()
  window.getSelection()?.removeAllRanges()
})

describe('CopyButton', () => {
  test('announces „Zkopírováno“ after a copy that got through', async () => {
    mockClipboard(() => Promise.resolve())
    render(<CopyButton value={ADDRESS}>{ADDRESS}</CopyButton>)

    await clickButton()

    expect(screen.getByRole('status').textContent).toBe('Zkopírováno')
  })

  test('selects the value and says how to copy it when the clipboard refuses', async () => {
    mockClipboard(() => Promise.reject(new Error('denied')))
    render(<CopyButton value={ADDRESS}>{ADDRESS}</CopyButton>)

    await clickButton()

    expect(selectedText()).toBe(ADDRESS)
    expect(document.activeElement).toBe(screen.getByRole('button'))
    expect(screen.getByRole('status').textContent).toBe(WEB_SENTENCE)
  })

  test('speaks in the administration voice there', async () => {
    mockClipboard(() => Promise.reject(new Error('denied')))
    render(
      <CopyButton surface={'administration'} value={ADDRESS}>
        {ADDRESS}
      </CopyButton>,
    )

    await clickButton()

    expect(screen.getByRole('status').textContent).toBe(
      'Zkopírujte označený text pomocí Ctrl+C, na Macu ⌘C — kopírování tlačítkem se nepodařilo.',
    )
  })

  test('drops the sentence once the reader copies', async () => {
    mockClipboard(() => Promise.reject(new Error('denied')))
    render(<CopyButton value={ADDRESS}>{ADDRESS}</CopyButton>)

    await clickButton()
    act(() => {
      document.dispatchEvent(new Event('copy'))
    })

    expect(screen.getByRole('status').textContent).toBe('')
  })

  test('drops the sentence on the next click that gets through', async () => {
    mockClipboard(() => Promise.reject(new Error('denied')))
    render(<CopyButton value={ADDRESS}>{ADDRESS}</CopyButton>)

    await clickButton()
    mockClipboard(() => Promise.resolve())
    await clickButton()

    expect(screen.getByRole('status').textContent).toBe('Zkopírováno')
  })

  test('asks to select and copy by hand, with no shortcut, without a fine pointer', async () => {
    mockFinePointer(false)
    mockClipboard(() => Promise.reject(new Error('denied')))
    render(<CopyButton value={ADDRESS}>{ADDRESS}</CopyButton>)

    await clickButton()

    expect(selectedText()).toBe(ADDRESS)
    expect(screen.getByRole('status').textContent).toBe(
      'Kopírování se nepovedlo. Označte celý text a zkopírujte ho.',
    )
  })

  test('names what it copies, so each button on a page is told apart', () => {
    mockClipboard(() => Promise.resolve())
    render(<CopyButton value={ADDRESS}>{ADDRESS}</CopyButton>)

    expect(
      screen.getByRole('button', { name: `Kopírovat ${ADDRESS}` }),
    ).toBeTruthy()
  })
})
