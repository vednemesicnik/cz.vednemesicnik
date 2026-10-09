import { nameCollator } from './name-collator'

const DIGIT_GROUP = '0–9'

const letterCollator = new Intl.Collator('cs', { sensitivity: 'base' })

type LetterGroup<Tag> = {
  letter: string
  tags: Tag[]
}

const getGroupLetter = (name: string) => {
  const trimmed = name.trim()

  if (/^\d/.test(trimmed)) return DIGIT_GROUP
  if (/^ch/i.test(trimmed)) return 'CH'

  const letter = trimmed.charAt(0).toLocaleUpperCase('cs')
  const withoutAccent = letter.normalize('NFD').replace(/\p{M}/gu, '')

  // Czech folds Á, Ď, É… into their base letter but keeps Č, Ř, Š, Ž apart.
  return letterCollator.compare(letter, withoutAccent) === 0
    ? withoutAccent
    : letter
}

/**
 * Groups tags under the first letter of their name in Czech alphabetical
 * order (design 11c): CH after H, Š after S, tags starting with a digit in one
 * `0–9` group before A, ordered numerically (`2026-2` before `2026-10`).
 *
 * @param tags - The tags to group, in any order.
 * @returns The groups that have at least one tag, each with its tags sorted.
 */
export const groupTagsByLetter = <Tag extends { name: string }>(
  tags: Tag[],
): LetterGroup<Tag>[] => {
  const sortedTags = [...tags].sort((first, second) =>
    nameCollator.compare(first.name, second.name),
  )
  const groups = new Map<string, Tag[]>()

  for (const tag of sortedTags) {
    const letter = getGroupLetter(tag.name)
    groups.set(letter, [...(groups.get(letter) ?? []), tag])
  }

  return Array.from(groups, ([letter, groupTags]) => ({
    letter,
    tags: groupTags,
  }))
}
