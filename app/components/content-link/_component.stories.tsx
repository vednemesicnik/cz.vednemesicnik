// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'

import { Badge } from '~/components/badge'
import { ContentLinkAuthor } from '~/components/content-link-author'
import { ContentLinkCategories } from '~/components/content-link-categories'
import { ContentLinkFooter } from '~/components/content-link-footer'
import { ContentLinkImage } from '~/components/content-link-image'
import { ContentLinkPublishDate } from '~/components/content-link-publish-date'
import { ContentLinkTitle } from '~/components/content-link-title'
import { ContentList } from '~/components/content-list'
import { ContentListItem } from '~/components/content-list-item'
import type { ImageSources } from '~/utils/image-store/create-image-sources'
import { ContentLink } from './_component'

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

const photo = createStaticSources('/images/article-link-image.jpeg', 96, 54)

// A square podcast cover with the show name on it, so the story shows that the
// whole cover stays visible.
const squareCover = createStaticSources(
  `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#1f2937"/><text x="200" y="215" font-family="sans-serif" font-size="56" font-weight="700" fill="#fff" text-anchor="middle">KABINET</text></svg>',
  )}`,
  400,
  400,
)

const publishDate = { formatted: '24. září 2026', iso: '2026-09-24' }

const meta: Meta<typeof ContentLink> = {
  component: ContentLink,
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
  title: 'Components/ContentLink',
}

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    children: (
      <>
        <ContentLinkImage alt={'Ilustrační fotografie'} image={photo} />
        <ContentLinkTitle>
          Proč jsme přestali číst na papíře, a proč se k němu vracíme
        </ContentLinkTitle>
        <ContentLinkFooter>
          <ContentLinkCategories>
            <Badge>Rozhovory</Badge>
            <Badge>Škola</Badge>
          </ContentLinkCategories>
          <ContentLinkAuthor>Anna Dvořáková, Jakub Malý</ContentLinkAuthor>
          <ContentLinkPublishDate date={publishDate} />
        </ContentLinkFooter>
      </>
    ),
    to: '/articles/proc-jsme-prestali-cist-na-papire',
  },
}

export const Overview: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <ContentList>
      <ContentListItem>
        <ContentLink to={'/articles/maturita'}>
          <ContentLinkImage alt={undefined} />
          <ContentLinkTitle>
            Maturita z pohledu těch, kdo ji teprve čekají
          </ContentLinkTitle>
          <ContentLinkFooter>
            <ContentLinkAuthor>Marie Horáková</ContentLinkAuthor>
            <ContentLinkPublishDate date={publishDate} />
          </ContentLinkFooter>
        </ContentLink>
      </ContentListItem>
      <ContentListItem>
        <ContentLink to={'/articles/kavarny'}>
          <ContentLinkImage alt={'Ilustrační fotografie'} image={photo} />
          <ContentLinkTitle>
            Sedm kaváren, kde se dá učit do večera
          </ContentLinkTitle>
          <ContentLinkFooter>
            <ContentLinkCategories>
              <Badge>Kultura</Badge>
            </ContentLinkCategories>
            <ContentLinkAuthor>Tomáš Beneš</ContentLinkAuthor>
            <ContentLinkPublishDate date={publishDate} />
          </ContentLinkFooter>
        </ContentLink>
      </ContentListItem>
      <ContentListItem>
        <ContentLink to={'/podcasts/kabinet/o-cem-se-mluvi-ve-sborovne'}>
          <ContentLinkImage
            alt={'Obálka pořadu Kabinet'}
            image={squareCover}
            shape={'square'}
          />
          <ContentLinkTitle number={13}>
            O čem se mluví ve sborovně
          </ContentLinkTitle>
          <ContentLinkFooter>
            <ContentLinkPublishDate date={publishDate} />
          </ContentLinkFooter>
        </ContentLink>
      </ContentListItem>
      <ContentListItem>
        <ContentLink to={'/grants/vednemesicnik-2026'}>
          <ContentLinkTitle>Vedneměsíčník 2026</ContentLinkTitle>
          <ContentLinkFooter>
            <ContentLinkAuthor>
              Statutární město České Budějovice
            </ContentLinkAuthor>
          </ContentLinkFooter>
        </ContentLink>
      </ContentListItem>
    </ContentList>
  ),
}
