import type { EditHoldContent } from './edit-hold-content'

// The editor, by what it edits (copy rvp9ojsm, ahizoh4o).
const EDITOR: Record<EditHoldContent, string> = {
  article: 'editor článku',
  episode: 'editor epizody',
  issue: 'editor čísla',
  podcast: 'editor podcastu',
}

/**
 * The toast of a delete that waits for one's own editor in another tab (design
 * 23g, 26i; log 0036; copy rvp9ojsm). It says no more about where the
 * editor runs: the app cannot tell a live tab from a crashed browser's hold.
 *
 * @param content - What the editor edits.
 * @returns „Před smazáním zavřete editor článku, a pokud už je zavřený, zkuste
 *   smazání za chvíli znovu.“
 */
export const getOwnOtherTabDeleteRefusal = (content: EditHoldContent) =>
  `Před smazáním zavřete ${EDITOR[content]}, a pokud už je zavřený, zkuste smazání za chvíli znovu.`
