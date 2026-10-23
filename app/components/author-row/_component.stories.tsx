// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { AuthorRemoveButton } from '~/components/author-remove-button'
import { AuthorRowButton } from '~/components/author-row-button'
import { createImageSources } from '~/utils/image-store/create-image-sources'

import { AuthorRow } from './_component'

// No photo: the avatar shows the initials.
const NO_IMAGE = createImageSources('user-image', undefined)

const meta: Meta<typeof AuthorRow> = {
  component: AuthorRow,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Components/AuthorRow',
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Interactive base case (controls enabled): an article's author (design 24j).
 */
export const Playground: Story = {
  args: {
    image: NO_IMAGE,
    name: 'Pavel Říha',
  },
}

/**
 * The signed-in author's own row, marked *vy* (24j).
 */
export const Own: Story = {
  args: {
    ...Playground.args,
    isOwn: true,
  },
}

/**
 * A new account's author with its role, Změnit and the × (design 28f,
 * nstqrn5g).
 */
export const WithNoteAndActions: Story = {
  args: {
    ...Playground.args,
    children: (
      <>
        <AuthorRowButton>Změnit</AuthorRowButton>
        <AuthorRemoveButton name={'Pavel Říha'} onClick={() => {}} />
      </>
    ),
    note: 'Přispěvatel',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '360px' }}>
        <Story />
      </div>
    ),
  ],
}
