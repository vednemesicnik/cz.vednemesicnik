# Storybook — Project Conventions

## Story file location

Story files are **co-located** with the component and named `_component.stories.tsx`:

```
app/components/copy-button/
  _component.tsx
  _component.stories.tsx
  _styles.module.css
  index.ts
```

## Story file structure

```tsx
// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from '@storybook/react-vite'

import { MyComponent } from './_component'

const meta: Meta<typeof MyComponent> = {
  component: MyComponent,
  tags: ['autodocs'],
  title: 'Components/MyComponent',
  parameters: {
    layout: 'centered',
  },
}

export default meta
type Story = StoryObj<typeof meta>
```

## Story naming conventions

### Playground (always first)

The main interactive story with controls. Every component has exactly one.

```tsx
export const Playground: Story = {
  args: {
    // default values for the most common use case
  },
}
```

### Overview (optional)

When a component has multiple visual variants, Overview renders them all at once without controls.

```tsx
export const Overview: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <MyComponent variant="a">Variant A</MyComponent>
      <MyComponent variant="b">Variant B</MyComponent>
    </div>
  ),
}
```

### Specific scenarios (optional)

For states that are hard to trigger interactively (error state, loading, external dependency):

```tsx
export const ErrorState: Story = {
  args: { error: true },
}
```

## CSS imports

Storybook preview (`/.storybook/preview.ts`) imports:
- `~/styles/fonts.css`
- `~/styles/sizes.css`
- `~/styles/global.css`
- `~/styles/primitive-tokens.css`
- `~/styles/semantic-tokens.css`

`semantic-tokens.css` provides both themes: public tokens on `:root`, admin overrides under `[data-theme='admin']`. The preview exposes a `theme` toolbar (public/admin) that toggles `data-theme` on `<html>`; admin components/stories should render under the admin theme.