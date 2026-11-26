import type { Mark, Node } from '@tiptap/pm/model'

export type InlineRun = {
  link: Mark | null
  nodes: Node[]
}

const isSameLink = (first: Mark | null, second: Mark | null) =>
  first === null || second === null ? first === second : first.eq(second)

/**
 * Groups a textblock's inline children into runs, so one link split by inner
 * marks (e.g. a bold word inside it) renders as one anchor. Adjacent nodes
 * share a run when they carry an equal link mark (same attributes); nodes in a
 * link run lose the link mark, the caller wraps the run in it once.
 *
 * @param textblock - A paragraph or heading.
 * @returns The runs in document order; `link` is `null` for unlinked nodes.
 */
export const groupLinkRuns = (textblock: Node): InlineRun[] => {
  const runs: InlineRun[] = []

  textblock.forEach((child) => {
    const link = child.marks.find((mark) => mark.type.name === 'link') ?? null
    const node =
      link === null ? child : child.mark(link.removeFromSet(child.marks))
    const previous = runs.at(-1)

    if (previous !== undefined && isSameLink(previous.link, link)) {
      previous.nodes.push(node)
    } else {
      runs.push({ link, nodes: [node] })
    }
  })

  return runs
}
