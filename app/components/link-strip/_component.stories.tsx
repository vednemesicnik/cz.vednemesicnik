// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'

import { LinkStripLink } from '~/components/link-strip-link'
import { LinkStripLinks } from '~/components/link-strip-links'
import { LinkStripMore } from '~/components/link-strip-more'
import { LinkStripText } from '~/components/link-strip-text'

import { LinkStrip } from './_component'

const meta: Meta<typeof LinkStrip> = {
  component: LinkStrip,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  title: 'Components/LinkStrip',
}

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    children: (
      <>
        <LinkStripText>Články mají i štítky, třeba</LinkStripText>
        <LinkStripLinks>
          {['volný čas', 'učitelé', 'knihy'].map((label) => (
            <LinkStripLink key={label} to={`/articles/tags/${label}`}>
              {label}
            </LinkStripLink>
          ))}
        </LinkStripLinks>
        <LinkStripMore to={'/articles/tags'}>Všechny štítky</LinkStripMore>
      </>
    ),
  },
}

/** In the editorial preview, a tag the reader doesn't see (11e). */
export const Preview: Story = {
  args: {
    children: (
      <>
        <LinkStripText>Články mají i štítky, třeba</LinkStripText>
        <LinkStripLinks>
          {['volný čas', 'maturitní ples', 'knihy'].map((label) => (
            <LinkStripLink
              isPreview={label === 'maturitní ples'}
              key={label}
              to={`/articles/tags/${label}`}
            >
              {label}
            </LinkStripLink>
          ))}
        </LinkStripLinks>
        <LinkStripMore to={'/articles/tags'}>Všechny štítky</LinkStripMore>
      </>
    ),
  },
}

export const WithoutLinks: Story = {
  args: {
    children: (
      <>
        <LinkStripText>Články třídíme i do rubrik.</LinkStripText>
        <LinkStripMore to={'/articles/categories'}>
          Všechny rubriky
        </LinkStripMore>
      </>
    ),
  },
}
