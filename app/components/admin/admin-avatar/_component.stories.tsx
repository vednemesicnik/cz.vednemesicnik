// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { createImageSources } from '~/utils/image-store/create-image-sources'

import { AdminAvatar } from './_component'

const noImage = createImageSources('user-image', undefined)

const meta: Meta<typeof AdminAvatar> = {
  argTypes: {
    image: { control: false },
    size: {
      control: 'select',
      options: ['extra-small', 'small', 'medium', 'large'],
    },
  },
  component: AdminAvatar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Administration/AdminAvatar',
}

export default meta
type Story = StoryObj<typeof meta>

// Without a photo the initials stand in, on the signature gradient.
export const Playground: Story = {
  args: {
    alt: 'Marie Horáková',
    image: noImage,
    name: 'Marie Horáková',
    size: 'medium',
  },
}

export const Overview: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ alignItems: 'center', display: 'flex', gap: '16px' }}>
      <AdminAvatar
        alt="Marie Horáková"
        image={noImage}
        name="Marie Horáková"
        size="extra-small"
      />
      <AdminAvatar
        alt="Marie Horáková"
        image={noImage}
        name="Marie Horáková"
        size="small"
      />
      <AdminAvatar
        alt="Marie Horáková"
        image={noImage}
        name="Marie Horáková"
        size="medium"
      />
      <AdminAvatar
        alt="Marie Horáková"
        image={noImage}
        name="Marie Horáková"
        size="large"
      />
    </div>
  ),
}
