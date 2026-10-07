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
import { PostContentLink } from './_component'

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

const publishDate = { formatted: '24. září 2026', iso: '2026-09-24' }

const meta: Meta<typeof PostContentLink> = {
  component: PostContentLink,
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
  title: 'Components/PostContentLink',
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
        <PostContentLink to={'/articles/maturita'}>
          <ContentLinkImage alt={undefined} />
          <ContentLinkTitle>
            Maturita z pohledu těch, kdo ji teprve čekají
          </ContentLinkTitle>
          <ContentLinkFooter>
            <ContentLinkAuthor>Marie Horáková</ContentLinkAuthor>
            <ContentLinkPublishDate date={publishDate} />
          </ContentLinkFooter>
        </PostContentLink>
      </ContentListItem>
      <ContentListItem>
        <PostContentLink to={'/articles/kavarny'}>
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
        </PostContentLink>
      </ContentListItem>
      <ContentListItem>
        <PostContentLink to={'/grants/vednemesicnik-2026'}>
          <ContentLinkTitle>Vedneměsíčník 2026</ContentLinkTitle>
          <ContentLinkFooter>
            <ContentLinkAuthor>
              Statutární město České Budějovice
            </ContentLinkAuthor>
          </ContentLinkFooter>
        </PostContentLink>
      </ContentListItem>
    </ContentList>
  ),
}
