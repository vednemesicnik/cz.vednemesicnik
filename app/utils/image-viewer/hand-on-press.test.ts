// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

import { handOnPress } from './hand-on-press'

// jsdom may lack PointerEvent: a MouseEvent that carries the pointer's id.
class TestPointerEvent extends MouseEvent {
  pointerId: number

  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init)
    this.pointerId = init.pointerId ?? 0
  }
}

let button: HTMLButtonElement
let under: Element | null

const pressOnRoot = () => {
  const press = new TestPointerEvent('pointerdown', {
    bubbles: true,
    clientX: 10,
    clientY: 20,
    pointerId: 3,
  })
  document.documentElement.dispatchEvent(press)

  return press as unknown as PointerEvent
}

const clickOnRoot = () =>
  document.documentElement.dispatchEvent(
    new MouseEvent('click', { bubbles: true }),
  )

beforeEach(() => {
  vi.stubGlobal('PointerEvent', TestPointerEvent)
  button = document.createElement('button')
  document.body.append(button)
  under = button
  // jsdom lays nothing out: `under` is what lies under the pointer.
  Object.assign(document, { elementFromPoint: () => under })
})

afterEach(() => {
  vi.unstubAllGlobals()
  Reflect.deleteProperty(document, 'elementFromPoint')
  document.body.replaceChildren()
})

describe('handOnPress', () => {
  test('the pointer-down goes on to the element under the pointer', () => {
    const handlePointerDown = vi.fn()
    button.addEventListener('pointerdown', handlePointerDown)

    handOnPress(pressOnRoot())

    expect(handlePointerDown).toHaveBeenCalledTimes(1)
    expect(handlePointerDown.mock.lastCall?.[0].pointerId).toBe(3)
  })

  test('the click that follows goes on to the button, once', () => {
    const handleClick = vi.fn()
    button.addEventListener('click', handleClick)

    handOnPress(pressOnRoot())
    clickOnRoot()
    clickOnRoot()

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  test('a press that ends in a cancel leaves no click behind', () => {
    const handleClick = vi.fn()
    button.addEventListener('click', handleClick)

    handOnPress(pressOnRoot())
    window.dispatchEvent(new Event('pointercancel'))
    clickOnRoot()

    expect(handleClick).not.toHaveBeenCalled()
  })

  test('a press that reached its own element is left as it is', () => {
    const handlePointerDown = vi.fn()
    button.addEventListener('pointerdown', handlePointerDown)
    const press = new TestPointerEvent('pointerdown', { bubbles: true })
    button.dispatchEvent(press)
    handlePointerDown.mockClear()

    handOnPress(press as unknown as PointerEvent)

    expect(handlePointerDown).not.toHaveBeenCalled()
  })
})
