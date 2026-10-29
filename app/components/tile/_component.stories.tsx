// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
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
          <TileFallback>Kabinet</TileFallback>
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
          <TileFallback>podzim 2026</TileFallback>
        </TileCard>
        <TileCaption>
          podzim 2026
          <TileSublabel>3/2026</TileSublabel>
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
          <TileFallback>Maturitní ples</TileFallback>
        </TileCard>
        <TileCaption>
          Maturitní ples
          <TileSublabel>doplněk k číslu červen 2026</TileSublabel>
        </TileCaption>
      </>
    ),
  },
}
