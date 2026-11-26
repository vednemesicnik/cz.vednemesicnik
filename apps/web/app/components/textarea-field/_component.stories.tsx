import type { FieldMetadata } from '@conform-to/react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import { TextareaFieldControl } from '~/components/textarea-field-control'
import { TextareaFieldCounter } from '~/components/textarea-field-counter'
import { TextareaFieldHint } from '~/components/textarea-field-hint'
import { TextareaFieldLabel } from '~/components/textarea-field-label'

import { TextareaField } from './_component'

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

const meta: Meta<typeof TextareaField> = {
  argTypes: {
    children: { control: false },
    field: { control: false },
  },
  component: TextareaField,
  tags: ['autodocs'],
  title: 'Primitives/TextArea',
}

export default meta
type Story = StoryObj<typeof TextareaField>

/**
 * Default textarea for multi-line text entry.
 * Provides 10 rows by default for comfortable input.
 */
export const Playground: Story = {
  args: {
    field: createMockField({ id: 'description', name: 'description' }),
  },
  render: (args) => (
    <TextareaField {...args}>
      <TextareaFieldLabel>Description</TextareaFieldLabel>
      <TextareaFieldControl placeholder={'Enter a detailed description...'} />
    </TextareaField>
  ),
}

/**
 * Required textarea indicated with an asterisk (*) in the label's colour.
 * Use for mandatory multi-line form fields.
 */
export const Required: Story = {
  args: {
    field: createMockField({
      id: 'content',
      name: 'content',
      required: true,
    }),
  },
  render: (args) => (
    <TextareaField {...args}>
      <TextareaFieldLabel>Article Content</TextareaFieldLabel>
      <TextareaFieldControl
        placeholder={'Write your article content here...'}
      />
    </TextareaField>
  ),
}

/**
 * Optional textarea, with „(nepovinné)“ after the label.
 */
export const Optional: Story = {
  args: {
    field: createMockField({
      id: 'interest',
      name: 'interest',
    }),
  },
  render: (args) => (
    <TextareaField {...args}>
      <TextareaFieldLabel optional>Interest</TextareaFieldLabel>
      <TextareaFieldControl rows={3} />
    </TextareaField>
  ),
}

/**
 * Textarea with a hint below, linked to the textarea for screen readers, and
 * a counter at the row's end.
 */
export const WithHint: Story = {
  args: {
    field: createMockField({ id: 'bio', name: 'bio' }),
  },
  render: (args) => (
    <TextareaField {...args}>
      <TextareaFieldLabel>Bio</TextareaFieldLabel>
      <TextareaFieldControl
        defaultValue={'Fotí a píše reportáže ze školních akcí.'}
      />
      <TextareaFieldHint>Zatím se na webu nezobrazuje.</TextareaFieldHint>
      <TextareaFieldCounter>39 / 500</TextareaFieldCounter>
    </TextareaField>
  ),
}

/**
 * Over the limit: the error at the row's start, the counter in the error
 * colour at its end (design 28c).
 */
export const WithCounterError: Story = {
  args: {
    field: createMockField({
      errors: ['Zkraťte bio na nejvýše 500 znaků.'],
      id: 'bio-over',
      name: 'bio',
    }),
  },
  render: (args) => (
    <TextareaField {...args}>
      <TextareaFieldLabel>Bio</TextareaFieldLabel>
      <TextareaFieldControl />
      <TextareaFieldCounter>512 / 500</TextareaFieldCounter>
    </TextareaField>
  ),
}

/**
 * Over a limit that only advises: the counter turns amber, the field keeps
 * its look and nothing is blocked (design 24a, the perex).
 */
export const WithCounterAttention: Story = {
  args: {
    field: createMockField({ id: 'perex', name: 'perex' }),
  },
  render: (args) => (
    <TextareaField {...args}>
      <TextareaFieldLabel>Perex</TextareaFieldLabel>
      <TextareaFieldControl />
      <TextareaFieldHint>
        Shrnutí pro vyhledávače a náhled při sdílení. Na webu se nezobrazuje.
        Doporučeno do 160 znaků.
      </TextareaFieldHint>
      <TextareaFieldCounter tone={'attention'}>172 / 160</TextareaFieldCounter>
    </TextareaField>
  ),
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
  },
  render: (args) => (
    <TextareaField {...args}>
      <TextareaFieldLabel>Biography</TextareaFieldLabel>
      <TextareaFieldControl />
    </TextareaField>
  ),
}

/**
 * Disabled textarea prevents user interaction.
 * The field appears visually muted and cannot be edited.
 */
export const Disabled: Story = {
  args: {
    field: createMockField({ id: 'summary', name: 'summary' }),
  },
  render: (args) => (
    <TextareaField {...args}>
      <TextareaFieldLabel>Generated Summary</TextareaFieldLabel>
      <TextareaFieldControl
        disabled={true}
        value={
          'This is an automatically generated summary that cannot be edited.'
        }
      />
    </TextareaField>
  ),
}

/**
 * Textarea with pre-filled content.
 * Shows how the component handles existing multi-line text.
 */
export const WithValue: Story = {
  args: {
    field: createMockField({ id: 'comments', name: 'comments' }),
  },
  render: (args) => (
    <TextareaField {...args}>
      <TextareaFieldLabel>Comments</TextareaFieldLabel>
      <TextareaFieldControl
        value={
          'This is a pre-filled comment.\n\nIt can contain multiple lines of text.\n\nEach paragraph is separated by line breaks.'
        }
      />
    </TextareaField>
  ),
}

/**
 * Textarea with custom row count.
 * Demonstrates control over the visible height.
 */
export const CustomRows: Story = {
  args: {
    field: createMockField({ id: 'note', name: 'note' }),
  },
  render: (args) => (
    <TextareaField {...args}>
      <TextareaFieldLabel>Short Note</TextareaFieldLabel>
      <TextareaFieldControl placeholder={'Enter a brief note...'} rows={3} />
    </TextareaField>
  ),
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
  },
  render: (args) => (
    <TextareaField {...args}>
      <TextareaFieldLabel>Article Body</TextareaFieldLabel>
      <TextareaFieldControl
        placeholder={'Write your article here...'}
        rows={15}
      />
    </TextareaField>
  ),
}
