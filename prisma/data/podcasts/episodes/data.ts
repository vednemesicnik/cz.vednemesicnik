import type { PodcastEpisodeDataObject } from '~~/types/podcast-episode-data-object'
import { podcastId } from '../ids'
import { podcastEpisodeId } from './ids'

const podcastOneEpisodes = [
  {
    description:
      'Jaké to je, žít jeden školní rok v Bavorsku, bydlet u německé rodiny a chodit tam do školy? To vše se dozvíte v prvním díle podcastu studentských novin Vedneměsíčník! O svých zkušenostech si s šéfredaktorkou Lucií Procházkovou povídá redaktorka Barbora Kortusová. Proč se jí ani nechtělo vracet zpátky do Čech? A jak se stalo, že skončila s učitelským sborem na skleničce?',
    id: podcastEpisodeId.podcast1.episode1,
    number: 1,
    podcastId: podcastId.podcast1,
    publishedAt: new Date('2023-04-07'),
    slug: 'na-skolni-rok-do-bavorska',
    state: 'published',
    title: 'Na školní rok do Bavorska. Jaké to je?',
  },
  {
    description:
      'Dánsko, Malta, Švýcarsko... to je jen malá část z výčtu zemí, které navštívila naše redaktorka Anna Peclová. V nové epizodě vypráví o svém dobrodružném přespání v dánském „shelteru“, radí kdy (ne)jet na Maltu nebo jak ve Švýcarsku neutratit korunu. O jejích cestách a nevšedních zážitcích si povídala s šéfredaktorkou Lucií Procházkovou. A dozvíte se také, na co je třeba dát si pozor, když čekáte na blikající Eiffelovku...',
    id: podcastEpisodeId.podcast1.episode2,
    number: 2,
    podcastId: podcastId.podcast1,
    publishedAt: new Date('2023-05-08'),
    slug: 'jak-poznat-svet-a-moc-pri-tom-neutratit',
    state: 'published',
    title: 'Jak poznat svět a moc při tom neutratit?',
  },
] as const satisfies PodcastEpisodeDataObject[]

export const podcastEpisodesData = [...podcastOneEpisodes]
