# CSS Layers — Project Conventions

## Layer declaration

Layers are declared once, in `app/styles/global.css`, in cascade priority order (lowest → highest):

```css
@layer base, component, variant, layout, route;
```

Never redeclare or reorder layers in other files.

## Layer purposes

| Layer       | Used for                                                                 |
|:------------|:-------------------------------------------------------------------------|
| `base`      | Global resets, design tokens, typography defaults (`app/styles/`)        |
| `component` | Reusable component styles (`app/components/`)                            |
| `variant`   | Modifier classes that override `component` styles (size, color, state)   |
| `layout`    | Route layout shells — grid areas, z-index scales, layout-level overrides |
| `route`     | Page-specific styles and overrides inside route files (`app/routes/`)    |

## Syntax — CSS Modules (`.module.css`)

Place `@layer` **inside** the selector. This is required so that IDEs can navigate to the selector directly from the class reference in TypeScript.

```css
/* ✅ correct — @layer inside selector */
.button {
  @layer component {
    display: inline-flex;
    align-items: center;
  }
}

.button.sm {
  @layer variant {
    padding-block: 0.5rem;
    font-size: var(--font-size-sm);
  }
}
```

```css
/* ❌ wrong — @layer wraps the selector */
@layer component {
  .button {
    display: inline-flex;
  }
}
```

## Syntax — plain CSS (`.css`)

Plain CSS files that style global HTML elements (`:root`, `body`, `*`) use `@layer` on the outside, because there is no class selector to navigate to.

```css
/* app/routes/website/__layout/_styles.css */
@layer layout {
  :root {
    --content-max-width: 940px;
  }

  body {
    background-color: var(--bg-primary);
  }
}
```

## Which layer to use

- Writing a new component in `app/components/` → `@layer component`
- Adding a size/color/state modifier class → `@layer variant`
- Styling a route layout shell → `@layer layout`
- Adjusting component appearance for a specific page → `@layer route`
- Setting a global CSS variable or reset → `@layer base`

## Nesting inside selectors

CSS nesting is supported. Write nested selectors and pseudo-classes inside the `@layer` block:

```css
.link {
  @layer component {
    color: var(--primary);

    &:hover {
      color: var(--primary-hover);
    }

    &:focus-visible {
      box-shadow: var(--focus-shadow);
      outline: none;
    }
  }
}
```