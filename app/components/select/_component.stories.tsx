import type { Meta, StoryObj } from "@storybook/react-vite"

import { Select } from "./_component"

const meta: Meta<typeof Select> = {
  title: "Primitives/Select",
  component: Select,
  tags: ["autodocs"],
  argTypes: {
    label: {
      control: "text",
      description: "Label text for the select field",
    },
    required: {
      control: "boolean",
      description: "Whether the select is required",
    },
    disabled: {
      control: "boolean",
      description: "Whether the select is disabled",
    },
    errors: {
      control: "object",
      description: "Array of error messages to display",
    },
  },
}

export default meta
type Story = StoryObj<typeof Select>

/**
 * Default select dropdown with multiple options.
 * The most common select variant for choosing from a list.
 */
export const Default: Story = {
  args: {
    label: "Country",
    id: "country",
  },
  render: (args) => (
    <Select {...args}>
      <option value="">Select a country</option>
      <option value="us">United States</option>
      <option value="uk">United Kingdom</option>
      <option value="ca">Canada</option>
      <option value="au">Australia</option>
    </Select>
  ),
}

/**
 * Required select field indicated with an asterisk (*).
 * Use for mandatory selection fields.
 */
export const Required: Story = {
  args: {
    label: "Role",
    id: "role",
    required: true,
  },
  render: (args) => (
    <Select {...args}>
      <option value="">Choose your role</option>
      <option value="contributor">Contributor</option>
      <option value="creator">Creator</option>
      <option value="coordinator">Coordinator</option>
    </Select>
  ),
}

/**
 * Select field with error messages displayed below.
 * Shows validation errors to the user.
 */
export const WithErrors: Story = {
  args: {
    label: "Category",
    id: "category",
    errors: ["Please select a category"],
  },
  render: (args) => (
    <Select {...args}>
      <option value="">Select a category</option>
      <option value="tech">Technology</option>
      <option value="science">Science</option>
      <option value="arts">Arts</option>
    </Select>
  ),
}

/**
 * Disabled select field prevents user interaction.
 * The field appears visually muted and cannot be changed.
 */
export const Disabled: Story = {
  args: {
    label: "Status",
    id: "status",
    disabled: true,
  },
  render: (args) => (
    <Select {...args}>
      <option value="draft">Draft</option>
      <option value="published" selected>
        Published
      </option>
      <option value="archived">Archived</option>
    </Select>
  ),
}

/**
 * Select with pre-selected value.
 * Shows how the component handles default selection.
 */
export const WithDefaultValue: Story = {
  args: {
    label: "Language",
    id: "language",
    defaultValue: "en",
  },
  render: (args) => (
    <Select {...args}>
      <option value="en">English</option>
      <option value="es">Spanish</option>
      <option value="fr">French</option>
      <option value="de">German</option>
    </Select>
  ),
}

/**
 * Select with grouped options.
 * Organizes related options using optgroup.
 */
export const WithGroups: Story = {
  args: {
    label: "Favorite Food",
    id: "food",
  },
  render: (args) => (
    <Select {...args}>
      <option value="">Select your favorite</option>
      <optgroup label="Fruits">
        <option value="apple">Apple</option>
        <option value="banana">Banana</option>
        <option value="orange">Orange</option>
      </optgroup>
      <optgroup label="Vegetables">
        <option value="carrot">Carrot</option>
        <option value="broccoli">Broccoli</option>
        <option value="spinach">Spinach</option>
      </optgroup>
    </Select>
  ),
}

/**
 * Select for article state management.
 * Demonstrates real-world usage in content lifecycle.
 */
export const ArticleState: Story = {
  args: {
    label: "Article State",
    id: "article-state",
    required: true,
  },
  render: (args) => (
    <Select {...args}>
      <option value="draft">Draft</option>
      <option value="published">Published</option>
      <option value="archived">Archived</option>
    </Select>
  ),
}