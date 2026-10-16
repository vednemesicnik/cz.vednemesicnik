// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { createImageSources } from '~/utils/image-store/create-image-sources'

import { Avatar } from './_component'

const noImage = createImageSources('user-image', undefined)

const meta: Meta<typeof Avatar> = {
  argTypes: {
    image: { control: false },
    size: { control: { max: 128, min: 16, type: 'range' } },
  },
  component: Avatar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Components/Avatar',
}

export default meta
type Story = StoryObj<typeof meta>

// Without a photo the initials stand in, on the signature gradient.
export const Playground: Story = {
  args: {
    image: noImage,
    name: 'Marie Horáková',
    size: 28,
  },
}

// The sizes of the author picker (24j): a suggestion and a chosen row.
export const Overview: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ alignItems: 'center', display: 'flex', gap: '12px' }}>
      <Avatar image={noImage} name={'Veronika Pokorná'} size={24} />
      <Avatar image={noImage} name={'Tereza Malá'} size={28} />
      <Avatar image={noImage} name={'Vedneměsíčník, z. s.'} size={28} />
    </div>
  ),
}
