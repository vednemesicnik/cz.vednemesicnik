// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'

import { CoverHeaderBody } from '~/components/cover-header-body'
import { CoverHeaderCover } from '~/components/cover-header-cover'
import { EpisodeNumber } from '~/components/episode-number'
import { Headline } from '~/components/headline'
import { Paragraph } from '~/components/paragraph'
import { ParentLink } from '~/components/parent-link'
import { Subheadline } from '~/components/subheadline'
import type { ImageSources } from '~/utils/image-store/create-image-sources'
import { CoverHeader } from './_component'

const createSvgSources = (label: string, size: number): ImageSources => {
  const src = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="#1f2937"/><text x="${size / 2}" y="${size / 2 + 20}" font-family="sans-serif" font-size="56" font-weight="700" fill="#fff" text-anchor="middle">${label}</text></svg>`,
  )}`

  return {
    avifSrcSet: undefined,
    height: size,
    placeholder: src,
    src,
    srcSet: `${src} ${size}w`,
    width: size,
  }
}

const cover = createSvgSources('KABINET', 400)

const meta: Meta<typeof CoverHeader> = {
  component: CoverHeader,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div style={{ maxWidth: '940px', width: '100%' }}>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  title: 'Components/CoverHeader',
}

export default meta
type Story = StoryObj<typeof meta>

/** The podcast's page (13b). */
export const Playground: Story = {
  render: (args) => (
    <CoverHeader {...args}>
      <ParentLink to={'/podcasts'}>Podcasty</ParentLink>
      <CoverHeaderCover alt={'Obálka podcastu Kabinet'} image={cover} />
      <CoverHeaderBody>
        <Headline>Kabinet</Headline>
        <Subheadline>Podcast · 11 epizod</Subheadline>
        <Paragraph>
          Rozhovory s učiteli o tom, co se ve škole děje za dveřmi kabinetu.
          Jednou za dva týdny, vždy s jiným hostem.
        </Paragraph>
      </CoverHeaderBody>
    </CoverHeader>
  ),
}

/** An episode's page (13c): the number grey outside the headline's gradient. */
export const Episode: Story = {
  render: (args) => (
    <CoverHeader {...args}>
      <ParentLink to={'/podcasts/kabinet'}>Kabinet</ParentLink>
      <CoverHeaderCover alt={'Obálka podcastu Kabinet'} image={cover} />
      <CoverHeaderBody>
        <Headline>
          <EpisodeNumber>{11}</EpisodeNumber> Jak se učí fyzika bez laboratoře
        </Headline>
        <Subheadline>
          <time dateTime={'2026-09-01'}>1. září 2026</time>
        </Subheadline>
      </CoverHeaderBody>
    </CoverHeader>
  ),
}
