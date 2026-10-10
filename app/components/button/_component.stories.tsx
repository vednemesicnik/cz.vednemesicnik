// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from './_component'

const meta: Meta<typeof Button> = {
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
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  title: 'Primitives/Button',
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Interactive base case (controls enabled).
 */
export const Playground: Story = {
  args: {
    children: 'Uložit',
    disabled: false,
    size: 'md',
    variant: 'primary',
  },
}

const variants = ['primary', 'secondary', 'outline', 'ghost', 'danger'] as const
const sizes = ['sm', 'md', 'lg'] as const

/**
 * Every variant in every size, and disabled. A dialog's actions are `ghost`
 * Zrušit beside a `primary` or `danger` confirm, both `sm`.
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
            <Button key={variant} size={size} variant={variant}>
              {variant}
            </Button>
          ))}
        </div>
      ))}
      <div style={{ alignItems: 'center', display: 'flex', gap: '8px' }}>
        {variants.map((variant) => (
          <Button disabled key={variant} variant={variant}>
            {variant}
          </Button>
        ))}
      </div>
    </div>
  ),
}
