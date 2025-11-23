import type { Meta, StoryObj } from "@storybook/react-vite"

import { TextArea } from "./_component"

const meta: Meta<typeof TextArea> = {
  title: "Primitives/TextArea",
  component: TextArea,
  tags: ["autodocs"],
  argTypes: {
    label: {
      control: "text",
      description: "Label text for the textarea field",
    },
    required: {
      control: "boolean",
      description: "Whether the textarea is required",
    },
    disabled: {
      control: "boolean",
      description: "Whether the textarea is disabled",
    },
    errors: {
      control: "object",
      description: "Array of error messages to display",
    },
    rows: {
      control: "number",
      description: "Number of visible text rows",
    },
  },
}

export default meta
type Story = StoryObj<typeof TextArea>

/**
 * Default textarea for multi-line text entry.
 * Provides 10 rows by default for comfortable input.
 */
export const Default: Story = {
  args: {
    label: "Description",
    id: "description",
    placeholder: "Enter a detailed description...",
  },
}

/**
 * Required textarea indicated with an asterisk (*).
 * Use for mandatory multi-line form fields.
 */
export const Required: Story = {
  args: {
    label: "Article Content",
    id: "content",
    placeholder: "Write your article content here...",
    required: true,
  },
}

/**
 * Textarea with error messages displayed below.
 * Shows validation errors to the user.
 */
export const WithErrors: Story = {
  args: {
    label: "Biography",
    id: "bio",
    errors: [
      "Biography must be at least 50 characters",
      "Please avoid special characters",
    ],
  },
}

/**
 * Disabled textarea prevents user interaction.
 * The field appears visually muted and cannot be edited.
 */
export const Disabled: Story = {
  args: {
    label: "Generated Summary",
    id: "summary",
    value: "This is an automatically generated summary that cannot be edited.",
    disabled: true,
  },
}

/**
 * Textarea with pre-filled content.
 * Shows how the component handles existing multi-line text.
 */
export const WithValue: Story = {
  args: {
    label: "Comments",
    id: "comments",
    value:
      "This is a pre-filled comment.\n\nIt can contain multiple lines of text.\n\nEach paragraph is separated by line breaks.",
  },
}

/**
 * Textarea with custom row count.
 * Demonstrates control over the visible height.
 */
export const CustomRows: Story = {
  args: {
    label: "Short Note",
    id: "note",
    placeholder: "Enter a brief note...",
    rows: 3,
  },
}

/**
 * Textarea for long-form content.
 * Suitable for articles, blog posts, or extensive descriptions.
 */
export const LongForm: Story = {
  args: {
    label: "Article Body",
    id: "article-body",
    placeholder: "Write your article here...",
    required: true,
    rows: 15,
  },
}