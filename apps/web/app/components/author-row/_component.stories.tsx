// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { AuthorRemoveButton } from '~/components/author-remove-button'
import { AuthorRowAvatar } from '~/components/author-row-avatar'
import { AuthorRowButton } from '~/components/author-row-button'
import { AuthorRowName } from '~/components/author-row-name'
import { AuthorRowNote } from '~/components/author-row-note'
import { AuthorRowText } from '~/components/author-row-text'
import { createImageSources } from '~/utils/image-store/create-image-sources'

import { AuthorRow } from './_component'

// No photo: the avatar shows the initials.
const NO_IMAGE = createImageSources('user-image', undefined)

const meta: Meta<typeof AuthorRow> = {
  argTypes: {
    children: { control: false },
  },
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
    children: (
      <>
        <AuthorRowAvatar image={NO_IMAGE} name={'Pavel Říha'} />
        <AuthorRowText>
          <AuthorRowName>Pavel Říha</AuthorRowName>
        </AuthorRowText>
      </>
    ),
  },
}

/**
 * The signed-in author's own row, marked *vy* (24j).
 */
export const Own: Story = {
  args: {
    children: (
      <>
        <AuthorRowAvatar image={NO_IMAGE} name={'Pavel Říha'} />
        <AuthorRowText>
          <AuthorRowName>Pavel Říha</AuthorRowName>
          <AuthorRowNote>vy</AuthorRowNote>
        </AuthorRowText>
      </>
    ),
  },
}

/**
 * A new account's author with its role, Změnit and the × (design 28f,
 * nstqrn5g).
 */
export const WithNoteAndActions: Story = {
  args: {
    children: (
      <>
        <AuthorRowAvatar image={NO_IMAGE} name={'Pavel Říha'} />
        <AuthorRowText>
          <AuthorRowName>Pavel Říha</AuthorRowName>
          <AuthorRowNote>Přispěvatel</AuthorRowNote>
        </AuthorRowText>
        <AuthorRowButton>Změnit</AuthorRowButton>
        <AuthorRemoveButton name={'Pavel Říha'} onClick={() => {}} />
      </>
    ),
  },
  decorators: [
    (Story) => (
      <div style={{ width: '360px' }}>
        <Story />
      </div>
    ),
  ],
}
