// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'

import { ContentLinkAuthor } from '~/components/content-link-author'
import { ContentLinkCover } from '~/components/content-link-cover'
import { ContentLinkFooter } from '~/components/content-link-footer'
import { ContentLinkPublishDate } from '~/components/content-link-publish-date'
import { ContentLinkTitle } from '~/components/content-link-title'
import { ContentList } from '~/components/content-list'
import { ContentListItem } from '~/components/content-list-item'
import type { ImageSources } from '~/utils/image-store/create-image-sources'
import { MediaContentLink } from './_component'

const createSvgSources = (
  label: string,
  width: number,
  height: number,
): ImageSources => {
  const src = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="#1f2937"/><text x="${width / 2}" y="${height / 2 + 20}" font-family="sans-serif" font-size="56" font-weight="700" fill="#fff" text-anchor="middle">${label}</text></svg>`,
  )}`

  return {
    avifSrcSet: undefined,
    height,
    placeholder: src,
    src,
    srcSet: `${src} ${width}w`,
    width,
  }
}

// A square podcast cover with the show name on it, shown whole.
const squareCover = createSvgSources('KABINET', 400, 400)

// A wide cover, cropped to the centre square: only the middle of the label stays.
const wideCover = createSvgSources('NAHLAS', 800, 400)

const publishDate = { formatted: '22. září 2026', iso: '2026-09-22' }

const meta: Meta<typeof MediaContentLink> = {
  component: MediaContentLink,
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
  title: 'Components/MediaContentLink',
}

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    children: (
      <>
        <ContentLinkCover alt={'Obálka pořadu Kabinet'} image={squareCover} />
        <ContentLinkTitle number={13}>
          O čem se mluví ve sborovně
        </ContentLinkTitle>
        <ContentLinkFooter>
          <ContentLinkAuthor>Kabinet</ContentLinkAuthor>
          <ContentLinkPublishDate date={publishDate} />
        </ContentLinkFooter>
      </>
    ),
    to: '/podcasts/kabinet/o-cem-se-mluvi-ve-sborovne',
  },
}

const cards = (
  <ContentList>
    <ContentListItem>
      <MediaContentLink to={'/podcasts/kabinet/o-cem-se-mluvi-ve-sborovne'}>
        <ContentLinkCover alt={'Obálka pořadu Kabinet'} image={squareCover} />
        <ContentLinkTitle number={13}>
          O čem se mluví ve sborovně
        </ContentLinkTitle>
        <ContentLinkFooter>
          <ContentLinkAuthor>Kabinet</ContentLinkAuthor>
          <ContentLinkPublishDate date={publishDate} />
        </ContentLinkFooter>
      </MediaContentLink>
    </ContentListItem>
    <ContentListItem>
      <MediaContentLink to={'/podcasts/kabinet/kdo-pise-maturitni-otazky'}>
        <ContentLinkCover alt={'Obálka pořadu Kabinet'} image={squareCover} />
        <ContentLinkTitle number={12}>
          Kdo píše maturitní otázky, a proč se na ně nikdo nemůže připravit
          dopředu
        </ContentLinkTitle>
        <ContentLinkFooter>
          <ContentLinkAuthor>Kabinet</ContentLinkAuthor>
          <ContentLinkPublishDate date={publishDate} />
        </ContentLinkFooter>
      </MediaContentLink>
    </ContentListItem>
    <ContentListItem>
      <MediaContentLink to={'/podcasts/nahlas/podzimni-cislo-nahlas'}>
        <ContentLinkCover
          alt={'Obálka pořadu Vedneměsíčník nahlas'}
          image={wideCover}
        />
        <ContentLinkTitle number={24}>
          Podzimní číslo nahlas: rozhovory
        </ContentLinkTitle>
        <ContentLinkFooter>
          <ContentLinkAuthor>Vedneměsíčník nahlas</ContentLinkAuthor>
          <ContentLinkPublishDate date={publishDate} />
        </ContentLinkFooter>
      </MediaContentLink>
    </ContentListItem>
    <ContentListItem>
      <MediaContentLink to={'/podcasts/kabinet/jak-se-uci-fyzika'}>
        <ContentLinkTitle number={11}>
          Jak se učí fyzika bez laboratoře
        </ContentLinkTitle>
        <ContentLinkFooter>
          <ContentLinkPublishDate date={publishDate} />
        </ContentLinkFooter>
      </MediaContentLink>
    </ContentListItem>
  </ContentList>
)

/** With a cover (/podcasts), a long title, a non-square cover, and without a cover (the podcast page). */
export const Overview: Story = {
  parameters: { controls: { disable: true } },
  render: () => cards,
}

/** Below 640 px the cover stays beside the text at 80 × 80. */
export const Mobile: Story = {
  globals: { viewport: { isRotated: false, value: 'mobile1' } },
  parameters: { controls: { disable: true } },
  render: () => cards,
}
