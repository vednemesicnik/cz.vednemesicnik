// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { AuthorRow } from '~/components/author-row'
import { createImageSources } from '~/utils/image-store/create-image-sources'

import { AuthorRemoveButton } from './_component'

const meta: Meta<typeof AuthorRemoveButton> = {
  component: AuthorRemoveButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Components/AuthorRemoveButton',
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Interactive base case (controls enabled): its name and Tooltip read
 * „Odebrat Pavel Říha“.
 */
export const Playground: Story = {
  args: {
    name: 'Pavel Říha',
    onClick: () => {},
  },
}

/**
 * A co-author's row, the × at its end (24j).
 */
export const InRow: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ width: '360px' }}>
      <AuthorRow
        image={createImageSources('user-image', undefined)}
        name={'Pavel Říha'}
      >
        <AuthorRemoveButton name={'Pavel Říha'} onClick={() => {}} />
      </AuthorRow>
    </div>
  ),
}
