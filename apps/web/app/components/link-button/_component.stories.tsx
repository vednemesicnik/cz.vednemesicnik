// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'
import { MemoryRouter } from 'react-router'

import { LinkButton } from './_component'

const meta: Meta<typeof LinkButton> = {
  argTypes: {
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
    },
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger'],
    },
  },
  component: LinkButton,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Primitives/LinkButton',
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Interactive base case (controls enabled).
 */
export const Playground: Story = {
  args: {
    children: 'Nová rubrika',
    disabled: false,
    size: 'md',
    to: '/administration/articles/categories/new',
    variant: 'primary',
  },
}

const variants = ['primary', 'secondary', 'outline', 'ghost', 'danger'] as const
const sizes = ['sm', 'md', 'lg'] as const

/**
 * Every variant in every size, and disabled — the same grid as `Button`.
 */
export const Overview: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'grid', gap: '16px' }}>
      {sizes.map((size) => (
        <div
          key={size}
          style={{ alignItems: 'center', display: 'flex', gap: '8px' }}
        >
          {variants.map((variant) => (
            <LinkButton key={variant} size={size} to={'/'} variant={variant}>
              {variant}
            </LinkButton>
          ))}
        </div>
      ))}
      <div style={{ alignItems: 'center', display: 'flex', gap: '8px' }}>
        {variants.map((variant) => (
          <LinkButton disabled key={variant} to={'/'} variant={variant}>
            {variant}
          </LinkButton>
        ))}
      </div>
    </div>
  ),
}
