type Key = Pick<
  KeyboardEvent,
  'altKey' | 'ctrlKey' | 'key' | 'metaKey' | 'shiftKey' | 'target'
>

/**
 * Whether a key closes the gallery viewer as Space (design 12b, nn7jjmoz):
 * plain Space, wherever it has no job of its own. On a button it presses the
 * button, and in a caption that scrolls it scrolls the text, even at its end.
 *
 * @param key - The key-down event, as the browser or React gives it.
 * @returns `true` on the dialog itself and on a link in a caption that fits.
 */
export const isSpaceToClose = ({
  altKey,
  ctrlKey,
  key,
  metaKey,
  shiftKey,
  target,
}: Key) => {
  if (key !== ' ' || altKey || ctrlKey || metaKey || shiftKey) return false
  if (!(target instanceof Element) || target.closest('button')) return false

  const caption = target.closest('figcaption')

  return caption === null || caption.scrollHeight <= caption.clientHeight
}
