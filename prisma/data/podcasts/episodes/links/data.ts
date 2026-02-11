import type { PodcastEpisodeLinkDataObject } from '~~/types/podcast-episode-link-data-object'
import { podcastEpisodeId } from '../ids'
import { podcastEpisodeLinkId } from './ids'

const podcast1Episode1Links = [
  {
    episodeId: podcastEpisodeId.podcast1.episode1,
    id: podcastEpisodeLinkId.podcast1.episode1.link1,
    label: 'Poslechněte si na Spotify',
    publishedAt: new Date('2023-04-07'),
    state: 'published',
    url: 'https://open.spotify.com/episode/1bvkvOUpQaeI5aWGV54lMw?si=m_d5aVnpTK6VjfqEpW0Agw',
  },
] as const satisfies PodcastEpisodeLinkDataObject[]

const podcast1Episode2Links = [
  {
    episodeId: podcastEpisodeId.podcast1.episode2,
    id: podcastEpisodeLinkId.podcast1.episode2.link1,
    label: 'Poslechněte si na Spotify',
    publishedAt: new Date('2023-05-08'),
    state: 'published',
    url: 'https://open.spotify.com/episode/0RAPF7NiAWs30LRrRjeNjM?si=B2PtiyxJS2SAnZyJ2lv45g',
  },
] as const satisfies PodcastEpisodeLinkDataObject[]

export const podcastEpisodeLinksData = [
  ...podcast1Episode1Links,
  ...podcast1Episode2Links,
]
