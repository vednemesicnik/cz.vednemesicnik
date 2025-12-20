import type { Meta, StoryObj } from '@storybook/react-vite'

import { TextArea } from './_component'

const meta: Meta<typeof TextArea> = {
  argTypes: {
    disabled: {
      control: 'boolean',
      description: 'Whether the textarea is disabled',
    },
    errors: {
      control: 'object',
      description: 'Array of error messages to display',
    },
    label: {
      control: 'text',
      description: 'Label text for the textarea field',
    },
    required: {
      control: 'boolean',
      description: 'Whether the textarea is required',
    },
    rows: {
      control: 'number',
      description: 'Number of visible text rows',
    },
  },
  component: TextArea,
  tags: ['autodocs'],
  title: 'Primitives/TextArea',
}

export default meta
type Story = StoryObj<typeof TextArea>

/**
 * Default textarea for multi-line text entry.
 * Provides 10 rows by default for comfortable input.
 */
export const Default: Story = {
  args: {
    id: 'description',
    label: 'Description',
    placeholder: 'Enter a detailed description...',
  },
}

/**
 * Required textarea indicated with an asterisk (*).
 * Use for mandatory multi-line form fields.
 */
export const Required: Story = {
  args: {
    id: 'content',
    label: 'Article Content',
    placeholder: 'Write your article content here...',
    required: true,
  },
}

/**
 * Textarea with error messages displayed below.
 * Shows validation errors to the user.
 */
export const WithErrors: Story = {
  args: {
    errors: [
      'Biography must be at least 50 characters',
      'Please avoid special characters',
    ],
    id: 'bio',
    label: 'Biography',
  },
}

/**
 * Disabled textarea prevents user interaction.
 * The field appears visually muted and cannot be edited.
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    id: 'summary',
    label: 'Generated Summary',
    value: 'This is an automatically generated summary that cannot be edited.',
  },
}

/**
 * Textarea with pre-filled content.
 * Shows how the component handles existing multi-line text.
 */
export const WithValue: Story = {
  args: {
    id: 'comments',
    label: 'Comments',
    value:
      'This is a pre-filled comment.\n\nIt can contain multiple lines of text.\n\nEach paragraph is separated by line breaks.',
  },
}

/**
 * Textarea with custom row count.
 * Demonstrates control over the visible height.
 */
export const CustomRows: Story = {
  args: {
    id: 'note',
    label: 'Short Note',
    placeholder: 'Enter a brief note...',
    rows: 3,
  },
}

/**
 * Textarea for long-form content.
 * Suitable for articles, blog posts, or extensive descriptions.
 */
export const LongForm: Story = {
  args: {
    id: 'article-body',
    label: 'Article Body',
    placeholder: 'Write your article here...',
    required: true,
    rows: 15,
  },
}
