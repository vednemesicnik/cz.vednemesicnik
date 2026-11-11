// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { AuthorRow } from '~/components/author-row'
import { AuthorRowAvatar } from '~/components/author-row-avatar'
import { AuthorRowName } from '~/components/author-row-name'
import { AuthorRowText } from '~/components/author-row-text'
import { createImageSources } from '~/utils/image-store/create-image-sources'

import { AuthorRowButton } from './_component'

const meta: Meta<typeof AuthorRowButton> = {
  component: AuthorRowButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Components/AuthorRowButton',
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Interactive base case (controls enabled).
 */
export const Playground: Story = {
  args: {
    children: 'Vyměnit',
  },
}

/**
 * At the end of an `AuthorRow`, which shortens around it (24j).
 */
export const InRow: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ width: '360px' }}>
      <AuthorRow>
        <AuthorRowAvatar
          image={createImageSources('user-image', undefined)}
          name={'Pavel Říha'}
        />
        <AuthorRowText>
          <AuthorRowName>Pavel Říha</AuthorRowName>
        </AuthorRowText>
        <AuthorRowButton>Vyměnit</AuthorRowButton>
      </AuthorRow>
    </div>
  ),
}
