type SaveShortcutEvent = Pick<
  KeyboardEvent,
  'altKey' | 'ctrlKey' | 'key' | 'metaKey' | 'shiftKey'
>

/**
 * Whether a key press is the platform's save shortcut: ⌘S on Apple systems,
 * Ctrl+S elsewhere (design 24e). ⌃S on a Mac stays free.
 *
 * @param event - The key press.
 * @param platform - `navigator.userAgentData?.platform ?? navigator.platform`.
 */
export const isSaveShortcut = (
  event: SaveShortcutEvent,
  platform: string,
): boolean => {
  if (event.key.toLowerCase() !== 's' || event.altKey || event.shiftKey) {
    return false
  }

  const isApple = /mac|iphone|ipad|ipod/i.test(platform)

  return isApple
    ? event.metaKey && !event.ctrlKey
    : event.ctrlKey && !event.metaKey
}
