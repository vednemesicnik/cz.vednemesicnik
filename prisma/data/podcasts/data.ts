import type { PodcastDataObject } from '~~/types/podcast-data-object'
import { podcastId } from './ids'

const podcast1 = {
  cover: {
    altText: 'Obálka podcastu Vedneměsíčník',
    filePath: 'prisma/assets/vednemesicnik_podcast_cover.jpg',
  },
  description:
    'Podcast studentských novin Vedneměsíčník. Redaktoři společně probírají své texty a články a baví se o věcech, které zajímají či trápí (nejen) mladou studentskou generaci.',
  id: podcastId.podcast1,
  publishedAt: new Date('2023-04-07'),
  slug: 'vednemesicnik',
  state: 'published',
  title: 'Vedneměsíčník',
} as const satisfies PodcastDataObject

export const podcastsData = [podcast1]
