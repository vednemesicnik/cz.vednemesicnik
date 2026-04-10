import type { FieldMetadata } from '@conform-to/react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import { AdminTextarea } from './_component'

const createMockField = (
  overrides?: Partial<FieldMetadata<string>>,
): FieldMetadata<string> =>
  ({
    errors: undefined,
    id: 'mock-field',
    name: 'mockField',
    required: false,
    ...overrides,
  }) as FieldMetadata<string>

const meta: Meta<typeof AdminTextarea> = {
  argTypes: {
    label: {
      control: 'text',
      description: 'Label text for the textarea field',
    },
  },
  component: AdminTextarea,
  tags: ['autodocs'],
  title: 'Primitives/TextArea',
}

export default meta
type Story = StoryObj<typeof AdminTextarea>

/**
 * Default textarea for multi-line text entry.
 * Provides 10 rows by default for comfortable input.
 */
export const Default: Story = {
  args: {
    field: createMockField({ id: 'description', name: 'description' }),
    label: 'Description',
    textareaProps: {
      placeholder: 'Enter a detailed description...',
    },
  },
}

/**
 * Required textarea indicated with an asterisk (*).
 * Use for mandatory multi-line form fields.
 */
export const Required: Story = {
  args: {
    field: createMockField({
      id: 'content',
      name: 'content',
      required: true,
    }),
    label: 'Article Content',
    textareaProps: {
      placeholder: 'Write your article content here...',
    },
  },
}

/**
 * Textarea with error messages displayed below.
 * Shows validation errors to the user.
 */
export const WithErrors: Story = {
  args: {
    field: createMockField({
      errors: [
        'Biography must be at least 50 characters',
        'Please avoid special characters',
      ],
      id: 'bio',
      name: 'bio',
    }),
    label: 'Biography',
  },
}

/**
 * Disabled textarea prevents user interaction.
 * The field appears visually muted and cannot be edited.
 */
export const Disabled: Story = {
  args: {
    field: createMockField({ id: 'summary', name: 'summary' }),
    label: 'Generated Summary',
    textareaProps: {
      disabled: true,
      value:
        'This is an automatically generated summary that cannot be edited.',
    },
  },
}

/**
 * Textarea with pre-filled content.
 * Shows how the component handles existing multi-line text.
 */
export const WithValue: Story = {
  args: {
    field: createMockField({ id: 'comments', name: 'comments' }),
    label: 'Comments',
    textareaProps: {
      value:
        'This is a pre-filled comment.\n\nIt can contain multiple lines of text.\n\nEach paragraph is separated by line breaks.',
    },
  },
}

/**
 * Textarea with custom row count.
 * Demonstrates control over the visible height.
 */
export const CustomRows: Story = {
  args: {
    field: createMockField({ id: 'note', name: 'note' }),
    label: 'Short Note',
    textareaProps: {
      placeholder: 'Enter a brief note...',
      rows: 3,
    },
  },
}

/**
 * Textarea for long-form content.
 * Suitable for articles, blog posts, or extensive descriptions.
 */
export const LongForm: Story = {
  args: {
    field: createMockField({
      id: 'article-body',
      name: 'articleBody',
      required: true,
    }),
    label: 'Article Body',
    textareaProps: {
      placeholder: 'Write your article here...',
      rows: 15,
    },
  },
}
