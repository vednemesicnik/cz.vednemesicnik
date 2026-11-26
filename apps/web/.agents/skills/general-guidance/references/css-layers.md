# CSS Layers — Project Conventions

## Layer declaration

Layers are declared once, in `app/styles/global.css`, in cascade priority order (lowest → highest):

```css
@layer base, component, variant, layout, route;
```

Never redeclare or reorder layers in other files.

## Layer purposes

| Layer       | Used for                                                                                   |
|:------------|:-------------------------------------------------------------------------------------------|
| `base`      | Global resets, design tokens, typography defaults (`app/styles/`)                          |
| `component` | Shared components in `app/components/` — **only** there                                    |
| `variant`   | A shared component's own modifiers, and one component restyling another one it renders    |
| `layout`    | Route layout shells — grid areas, z-index scales, layout-level overrides                   |
| `route`     | Everything under `app/routes/`: a route's stylesheet **and** its route-local components    |

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
/* app/routes/__layout/_styles.css */
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

Decide by **where the stylesheet lives** first, then by **whose element the rule styles**.

| The stylesheet…                                    | The rule styles…                                         | Layer       |
|:---------------------------------------------------|:---------------------------------------------------------|:------------|
| `app/components/<name>/`                           | the component's own elements                             | `component` |
| `app/components/<name>/`                           | its own modifier (`.sm`, `.isActive`, `.danger`)         | `variant`   |
| `app/components/<name>/`                           | another shared component it renders, via `className`     | `variant`   |
| `app/routes/**/components/<name>/` (route-local)   | the component's own elements **and** its own modifiers   | `route`     |
| `app/routes/**/components/<name>/` (route-local)   | a shared component it renders, via `className`           | `route`     |
| a route's `_styles.module.css`                     | anything on the page                                     | `route`     |
| a layout route's stylesheet                        | the shell: grid areas, z-index scale                     | `layout`    |
| `app/styles/`                                      | tokens, resets, element defaults                         | `base`      |

- **`component` never appears under `app/routes/`.** A component that lives in a route is
  route code, even when it is shaped like a shared one.
- **A route-local component's own modifiers stay in `route`**, not in `variant`: `variant` sits
  *below* `route`, so a modifier there loses to the base rule it should override. Inside one
  layer, specificity decides — `.panel.isOpen` beats `.panel`.
- **Restyling another component goes one layer above it.** A shared component restyling a
  shared one uses `variant`; anything under `app/routes/` is already above both.

```css
/* app/components/invoice-row/_styles.module.css — restyles the shared Badge it renders */
.statusBadge {
  @layer variant {
    font-size: var(--font-size-xs);
  }
}

/* app/routes/invoices/components/invoice-drawer/_styles.module.css — route-local */
.drawer {
  @layer route {
    display: none;
  }
}

.drawer.isOpen {
  @layer route {
    display: grid;
  }
}
```

### Why the layer, and not just the class, decides

Layers win before specificity and source order. Two one-class rules **in the same layer** have
equal specificity, so whichever CSS chunk the browser loads last wins. Dev and production
bundle chunks differently: an override in the overridden component's own layer can look right
in `pnpm app:dev` and break after `pnpm app:build`. A restyle one layer up wins in every bundle.
A wrapper that owns the whole look may instead render the component's unstyled base, which
has nothing to override.

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