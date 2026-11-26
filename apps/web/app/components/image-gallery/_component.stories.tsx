// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import type { GalleryImage } from '~/components/image-gallery-dialog'
import type { ImageSources } from '~/utils/image-store/create-image-sources'
import { ImageGallery } from './_component'

const createStaticSources = (
  src: string,
  width: number,
  height: number,
): ImageSources => ({
  avifSrcSet: undefined,
  height,
  placeholder: src,
  src,
  srcSet: `${src} ${width}w`,
  width,
})

const images: Array<GalleryImage> = [
  {
    alt: 'Kavárna s dlouhým stolem u okna',
    description: <p>Kavárna Místo, Praha 7.</p>,
    id: 'landscape',
    sources: createStaticSources('/images/article-link-image.jpeg', 96, 54),
  },
  {
    alt: 'Obálka tištěného čísla',
    description: <p>Obálka zářijového čísla.</p>,
    id: 'portrait',
    sources: createStaticSources('/images/issue-cover.jpeg', 110, 154),
  },
  {
    alt: 'Obálka podcastu',
    id: 'square',
    sources: createStaticSources('/images/podcast-cover.jpeg', 110, 117),
  },
  {
    alt: 'Obálka epizody podcastu',
    description: <p>Bez popisku by tu nebylo nic.</p>,
    id: 'episode',
    sources: createStaticSources(
      '/images/podcast-episode-cover.jpeg',
      110,
      117,
    ),
  },
  {
    alt: 'Kavárna podruhé',
    id: 'landscape-again',
    sources: createStaticSources('/images/article-link-image.jpeg', 96, 54),
  },
]

const meta: Meta<typeof ImageGallery> = {
  component: ImageGallery,
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '940px', width: '100%' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  title: 'Components/ImageGallery',
}

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    images,
  },
}

/** Only the featured image, the most common case: one tile in the first column. */
export const SingleImage: Story = {
  args: {
    images: images.slice(0, 1),
  },
}
