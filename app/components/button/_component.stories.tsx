import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from './_component'

const meta: Meta<typeof Button> = {
  argTypes: {
    color: {
      control: 'select',
      description: 'Color scheme: primary (violet) or danger (red)',
      options: ['primary', 'danger'],
    },
    disabled: {
      control: 'boolean',
      description:
        'Whether the button is disabled (reduces opacity and prevents interaction)',
    },
    size: {
      control: 'select',
      description: 'Button size controlling padding and font-size',
      options: ['sm', 'md', 'lg'],
    },
    type: {
      control: 'select',
      description: 'HTML button type attribute',
      options: ['button', 'submit', 'reset'],
    },
    variant: {
      control: 'select',
      description:
        'Visual style: filled (solid background) or outline (transparent background with border)',
      options: ['filled', 'outline'],
    },
  },
  component: Button,
  parameters: {
    docs: {
      description: {
        component:
          'Button component with two orthogonal axes: variant (filled | outline) and color (primary | danger). Features smooth transitions, hover effects, subtle scale on click, and focus-visible box-shadow for keyboard navigation.',
      },
    },
  },
  tags: ['autodocs'],
  title: 'Primitives/Button',
}

export default meta
type Story = StoryObj<typeof Button>

export const FilledPrimary: Story = {
  args: {
    children: 'Odeslat',
    color: 'primary',
    variant: 'filled',
  },
}

export const FilledDanger: Story = {
  args: {
    children: 'Smazat',
    color: 'danger',
    variant: 'filled',
  },
}

export const OutlinePrimary: Story = {
  args: {
    children: '+ Přidat',
    color: 'primary',
    variant: 'outline',
  },
}

export const OutlineDanger: Story = {
  args: {
    children: 'Odebrat',
    color: 'danger',
    variant: 'outline',
  },
}

export const Disabled: Story = {
  args: {
    children: 'Odesílám…',
    disabled: true,
    variant: 'filled',
  },
}

export const FormSubmit: Story = {
  args: {
    children: 'Odeslat formulář',
    type: 'submit',
    variant: 'filled',
  },
}
