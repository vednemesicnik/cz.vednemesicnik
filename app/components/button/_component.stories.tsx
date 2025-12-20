import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from './_component'

const meta: Meta<typeof Button> = {
  argTypes: {
    disabled: {
      control: 'boolean',
      description:
        'Whether the button is disabled (reduces opacity and prevents interaction)',
    },
    type: {
      control: 'select',
      description: 'HTML button type attribute',
      options: ['button', 'submit', 'reset'],
    },
    variant: {
      control: 'select',
      description:
        "Visual style variant: 'primary' for main actions (bright green), 'danger' for destructive actions (red), 'default' for secondary actions (outlined)",
      options: ['primary', 'danger', 'default'],
    },
  },
  component: Button,
  parameters: {
    docs: {
      description: {
        component:
          'Modern button component with three distinct variants. Features smooth transitions, hover effects, subtle scale on click, and focus-visible box-shadow for keyboard navigation (Tab key). Uses form design tokens for consistent styling across all variants.',
      },
    },
  },
  tags: ['autodocs'],
  title: 'Primitives/Button',
}

export default meta
type Story = StoryObj<typeof Button>

/**
 * Primary button variant used for main call-to-action buttons.
 * Use this for the most important action on a page or form.
 */
export const Primary: Story = {
  args: {
    children: 'Primary Button',
    variant: 'primary',
  },
}

/**
 * Danger button variant used for destructive actions.
 * Use this for delete, remove, or other potentially harmful operations.
 */
export const Danger: Story = {
  args: {
    children: 'Delete',
    variant: 'danger',
  },
}

/**
 * Default button variant used for secondary actions.
 * Use this for cancel, back, or other less prominent actions.
 */
export const Default: Story = {
  args: {
    children: 'Cancel',
    variant: 'default',
  },
}

/**
 * Disabled state prevents user interaction.
 * The button appears visually muted and cannot be clicked.
 */
export const Disabled: Story = {
  args: {
    children: 'Disabled Button',
    disabled: true,
    variant: 'primary',
  },
}

/**
 * Submit button for forms.
 * When used inside a form, this will trigger form submission.
 */
export const FormSubmit: Story = {
  args: {
    children: 'Submit Form',
    type: 'submit',
    variant: 'primary',
  },
}

/**
 * Button with longer text content.
 * Shows how the button handles varying content lengths.
 */
export const LongText: Story = {
  args: {
    children: 'This is a button with much longer text content',
    variant: 'primary',
  },
}
