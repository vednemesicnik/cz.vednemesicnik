import { isValidEpisodeLinkUrl } from './is-valid-episode-link-url'

type EpisodeLink = {
  label: string
  url: string
}

type Lack = 'label' | 'url' | 'mixed'

const pluralRules = new Intl.PluralRules('cs')

// One sentence by what every incomplete link lacks (copy li7oq1zu).
const SENTENCES: Record<Lack, Record<'one' | 'few' | 'other', string>> = {
  label: {
    few: 'odkazy nemají název platformy.',
    one: 'odkaz nemá název platformy.',
    other: 'odkazů nemá název platformy.',
  },
  mixed: {
    few: 'odkazy nejsou úplné.',
    one: 'odkaz není úplný.',
    other: 'odkazů není úplných.',
  },
  url: {
    few: 'odkazy nemají platnou adresu.',
    one: 'odkaz nemá platnou adresu.',
    other: 'odkazů nemá platnou adresu.',
  },
}

/**
 * The sentence about the episode's incomplete links (design 27h, copy
 * li7oq1zu): a link is complete with a platform name and a valid address. It
 * counts every incomplete link and says what they lack when they all lack the
 * same thing.
 *
 * @param links - The episode's stored links.
 * @returns E.g. „2 odkazy nemají název platformy.“; `null` when every link is
 *   complete.
 */
export const formatIncompleteEpisodeLinksItem = (
  links: readonly EpisodeLink[],
): string | null => {
  const lacks = links.flatMap((link): Lack[] => {
    const hasLabel = link.label.trim() !== ''
    const hasUrl = isValidEpisodeLinkUrl(link.url)

    if (hasLabel && hasUrl) return []
    if (hasUrl) return ['label']
    if (hasLabel) return ['url']
    return ['mixed']
  })

  if (lacks.length === 0) return null

  const lack = lacks.every((each) => each === lacks[0]) ? lacks[0] : 'mixed'
  const rule = pluralRules.select(lacks.length)
  const form = rule === 'one' || rule === 'few' ? rule : 'other'

  return `${lacks.length} ${SENTENCES[lack][form]}`
}
