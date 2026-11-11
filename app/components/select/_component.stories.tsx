import type { Meta, StoryObj } from '@storybook/react-vite'

import { SelectControl } from '~/components/select-control'
import { SelectLabel } from '~/components/select-label'

import { Select } from './_component'

const meta: Meta<typeof Select> = {
  argTypes: {
    children: { control: false },
    errors: {
      control: 'object',
      description: 'Array of error messages to display',
    },
    required: {
      control: 'boolean',
      description: 'Whether the select is required',
    },
  },
  component: Select,
  tags: ['autodocs'],
  title: 'Primitives/Select',
}

export default meta
type Story = StoryObj<typeof Select>

/**
 * Default select dropdown with multiple options.
 * The most common select variant for choosing from a list.
 */
export const Default: Story = {
  args: {
    id: 'country',
  },
  render: (args) => (
    <Select {...args}>
      <SelectLabel>Country</SelectLabel>
      <SelectControl>
        <option value="">Select a country</option>
        <option value="us">United States</option>
        <option value="uk">United Kingdom</option>
        <option value="ca">Canada</option>
        <option value="au">Australia</option>
      </SelectControl>
    </Select>
  ),
}

/**
 * Required select field indicated with an asterisk (*) in the label's colour.
 * Use for mandatory selection fields.
 */
export const Required: Story = {
  args: {
    id: 'role',
    required: true,
  },
  render: (args) => (
    <Select {...args}>
      <SelectLabel>Role</SelectLabel>
      <SelectControl>
        <option value="">Choose your role</option>
        <option value="contributor">Contributor</option>
        <option value="creator">Creator</option>
        <option value="coordinator">Coordinator</option>
      </SelectControl>
    </Select>
  ),
}

/**
 * Select field with error messages displayed below.
 * Shows validation errors to the user.
 */
export const WithErrors: Story = {
  args: {
    errors: ['Please select a category'],
    id: 'category',
  },
  render: (args) => (
    <Select {...args}>
      <SelectLabel>Category</SelectLabel>
      <SelectControl>
        <option value="">Select a category</option>
        <option value="tech">Technology</option>
        <option value="science">Science</option>
        <option value="arts">Arts</option>
      </SelectControl>
    </Select>
  ),
}

/**
 * Disabled select field prevents user interaction.
 * The field appears visually muted and cannot be changed.
 */
export const Disabled: Story = {
  args: {
    id: 'status',
  },
  render: (args) => (
    <Select {...args}>
      <SelectLabel>Status</SelectLabel>
      <SelectControl disabled>
        <option value="draft">Draft</option>
        <option selected value="published">
          Published
        </option>
        <option value="archived">Archived</option>
      </SelectControl>
    </Select>
  ),
}

/**
 * Select with pre-selected value.
 * Shows how the component handles default selection.
 */
export const WithDefaultValue: Story = {
  args: {
    id: 'language',
  },
  render: (args) => (
    <Select {...args}>
      <SelectLabel>Language</SelectLabel>
      <SelectControl defaultValue={'en'}>
        <option value="en">English</option>
        <option value="es">Spanish</option>
        <option value="fr">French</option>
        <option value="de">German</option>
      </SelectControl>
    </Select>
  ),
}

/**
 * Select with grouped options.
 * Organizes related options using optgroup.
 */
export const WithGroups: Story = {
  args: {
    id: 'food',
  },
  render: (args) => (
    <Select {...args}>
      <SelectLabel>Favorite Food</SelectLabel>
      <SelectControl>
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
      </SelectControl>
    </Select>
  ),
}

/**
 * Select for article state management.
 * Demonstrates real-world usage in content lifecycle.
 */
export const ArticleState: Story = {
  args: {
    id: 'article-state',
    required: true,
  },
  render: (args) => (
    <Select {...args}>
      <SelectLabel>Article State</SelectLabel>
      <SelectControl>
        <option value="draft">Draft</option>
        <option value="published">Published</option>
        <option value="archived">Archived</option>
      </SelectControl>
    </Select>
  ),
}
