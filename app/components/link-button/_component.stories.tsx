// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { DownloadIcon } from '~/components/icons/download-icon'
import { withRouter } from '../../../.storybook/decorators/with-router'

import { LinkButton } from './_component'

const meta: Meta<typeof LinkButton> = {
  argTypes: {
    children: {
      control: 'text',
      description: 'Button content — text or a combination of text and icon',
      table: {
        type: { summary: 'ReactNode' },
      },
    },
    className: {
      control: false,
      description: 'Additional CSS class',
      table: {
        type: { summary: 'string' },
      },
    },
    prefetch: {
      control: 'select',
      description: 'Prefetch strategy for the target page',
      options: ['none', 'intent', 'render', 'viewport'],
      table: {
        defaultValue: { summary: 'intent' },
        type: { summary: "'none' | 'intent' | 'render' | 'viewport'" },
      },
    },
    size: {
      control: 'select',
      description: 'Size variant of the button',
      options: ['sm', 'md', 'lg'],
      table: {
        defaultValue: { summary: 'md' },
        type: { summary: "'sm' | 'md' | 'lg'" },
      },
    },
    to: {
      control: 'text',
      description: 'Target URL or path',
      table: {
        type: { summary: 'string | To' },
      },
    },
    viewTransition: {
      control: 'boolean',
      description: 'Enables the View Transition API during navigation',
      table: {
        defaultValue: { summary: 'true' },
        type: { summary: 'boolean' },
      },
    },
  },
  component: LinkButton,
  decorators: [withRouter],
  parameters: {
    docs: {
      description: {
        component:
          'A link styled as an outlined primary button. Use it for navigation where the visual appearance of a button is appropriate but the element is semantically a link.',
      },
    },
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Components/LinkButton',
}

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  args: {
    children: 'Go to page',
    to: '/example',
  },
}

export const Overview: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
      }}
    >
      <LinkButton to="/example">Go to page</LinkButton>
      <LinkButton to="/download">
        <DownloadIcon />
        Download file
      </LinkButton>
    </div>
  ),
}
