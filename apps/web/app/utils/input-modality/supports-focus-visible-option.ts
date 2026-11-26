let supported: boolean | null = null

/**
 * Whether the browser takes `focusVisible` in `focus()` options, which moves
 * the focus without its ring. Found without focusing anything: a detached
 * element takes no focus, but the browser still reads every option it knows.
 * The answer is kept after the first call.
 *
 * @returns `true` when `focus({ focusVisible: false })` is honoured.
 */
export const supportsFocusVisibleOption = () => {
  if (supported !== null) return supported

  let isRead = false
  const options = {
    get focusVisible() {
      isRead = true
      return false
    },
  }

  document.createElement('button').focus(options)
  supported = isRead

  return supported
}
