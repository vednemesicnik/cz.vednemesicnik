// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { Image } from '~/components/image'
import { StatusTag } from '~/components/status-tag'
import { TileCaption } from '~/components/tile-caption'
import { TileCard } from '~/components/tile-card'
import { TileFallback } from '~/components/tile-fallback'
import { TileSublabel } from '~/components/tile-sublabel'

import { Tile } from './_component'

const meta: Meta<typeof Tile> = {
  component: Tile,
  decorators: [
    (Story) => (
      <div style={{ width: '220px' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Components/Tile',
}

export default meta
type Story = StoryObj<typeof meta>

/** A podcast's square tile with one line under it (13a). */
export const Playground: Story = {
  args: {
    children: (
      <>
        <TileCard>
          <Image
            alt={'Obálka podcastu Kabinet'}
            height={117}
            sizes={'220px'}
            src={'/images/podcast-cover.jpeg'}
            width={110}
          />
        </TileCard>
        <TileCaption>Kabinet</TileCaption>
      </>
    ),
  },
}

/** A printed issue: 3 : 4, the name with the year and the order under it (14a). */
export const Cover: Story = {
  args: {
    children: (
      <>
        <TileCard ratio={'cover'}>
          <Image
            alt={'Obálka čísla podzim 2026'}
            height={154}
            sizes={'220px'}
            src={'/images/issue-cover.jpeg'}
            width={110}
          />
        </TileCard>
        <TileCaption>
          podzim 2026
          <TileSublabel>3/2026</TileSublabel>
        </TileCaption>
      </>
    ),
  },
}

/** A published issue without a cover: the gradient with its name (14c). */
export const WithoutCover: Story = {
  args: {
    children: (
      <>
        <TileCard ratio={'cover'}>
          <TileFallback>červen 2026</TileFallback>
        </TileCard>
        <TileCaption>
          červen 2026
          <TileSublabel>2/2026</TileSublabel>
        </TileCaption>
      </>
    ),
  },
}

/** A supplement, named by its own name and its main issue (14a, wo02u3xq). */
export const Supplement: Story = {
  args: {
    children: (
      <>
        <TileCard ratio={'cover'}>
          <Image
            alt={'Obálka doplňku Maturitní ples'}
            height={154}
            sizes={'220px'}
            src={'/images/issue-cover.jpeg'}
            width={110}
          />
        </TileCard>
        <TileCaption>
          Maturitní ples
          <TileSublabel>doplněk k číslu červen 2026</TileSublabel>
        </TileCaption>
      </>
    ),
  },
}

/** A podcast the reader doesn't see: outlined, its grey tag under the label (10d). */
export const Preview: Story = {
  args: {
    children: (
      <>
        <TileCard>
          <Image
            alt={'Obálka podcastu Kabinet'}
            height={117}
            sizes={'220px'}
            src={'/images/podcast-cover.jpeg'}
            width={110}
          />
        </TileCard>
        <TileCaption>
          Kabinet
          <StatusTag muted state={'draft'} />
        </TileCaption>
      </>
    ),
    isPreview: true,
  },
}
