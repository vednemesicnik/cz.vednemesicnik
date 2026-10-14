# Component API

## Choose the shape in this order

1. **Compound components** — a root and named parts, composed in JSX. The default for
   anything that has parts: a card, a row, tabs, a menu, a dialog, a field with its label,
   hint and error.
2. **Props** — when the component has no parts of its own: a few scalar settings (`size`,
   `variant`, `disabled`), or one value that has to stay consistent and that composition would
   let the caller break.
3. **A render prop** — when the root owns values the caller's own markup needs (the open
   state, the selected item, an id, a computed label). The function hands them out where the
   caller can see and use them, instead of the root deciding behind a black box.

Go down the list only for a reason you can name in one sentence.

## Compound before props

A prop for every part (`title`, `image`, `footer`) turns the component into a form to fill in:
every new need is another prop, and the caller can't reorder, wrap or leave a part out.

```tsx
// bad — the parts are props, the structure is hidden inside
<RecipeCard
  footer={<span>45 min</span>}
  image={cover}
  layout={'wide'}
  title={'Bábovka'}
  to={'/recipes/babovka'}
/>

// good — the root and its parts, in the order they render
<RecipeCard to={'/recipes/babovka'}>
  <RecipeCardImage source={cover} />
  <RecipeCardTitle>Bábovka</RecipeCardTitle>
  <RecipeCardFooter>
    <span>45 min</span>
  </RecipeCardFooter>
</RecipeCard>
```

An array of items is the same mistake for a list-like component. Items as children let each
one take its own props, a condition or a wrapper:

```tsx
// bad
<Steps items={[{ label: 'Košík', to: '/cart' }, { label: 'Doprava', to: '/shipping' }]} />

// good
<Steps label={'Objednávka'}>
  <StepsItem to={'/cart'}>Košík</StepsItem>
  {needsShipping && <StepsItem to={'/shipping'}>Doprava</StepsItem>}
</Steps>
```

- **Every part is its own component** in its own kebab-case directory in `app/components/`,
  named after the root (`recipe-card`, `recipe-card-title`), or after the family when several
  roots share it. No `RecipeCard.Title` static members.
- **The root and each part render the element their role needs** (`<nav>` and `<ul>` for the
  root, `<li>` for the item; see `semantic-html.md`) and take `className` for the look.
- **A different shape is a different root, not a `layout` or `variant` prop.** Two cards that
  differ in structure are `WideRecipeCard` and `CompactRecipeCard`, named by their shape, sharing
  the parts. No `BaseRecipeCard` wrapper. A prop that switches the structure means every part
  has to know which structure it is in.

## When props are right

A component with no parts is configured, not composed:

```tsx
<Spinner size={'sm'} />
<Avatar name={'Eva Malá'} size={'lg'} source={photo} />
```

Use a prop also when the caller must not get something wrong, such as a value that has to
be the same on every part. Pass it once on the root and let the parts read it from context.

## Render props: hand values out, don't hide them

When the caller's markup depends on the root's state, a render prop shows the dependency at
the place it is used:

```tsx
// bad — the list decides how a selected row looks; the caller can't see or change it
<SelectableList highlightSelected={true} items={orders} />

// good — the list owns the selection, the caller renders the row with it
<SelectableList items={orders}>
  {({ item, isSelected, toggle }) => (
    <OrderRow onToggle={toggle} order={item} selected={isSelected} />
  )}
</SelectableList>
```

- **Context for the parts of the compound, render props for the caller's markup.** A part the
  compound ships (`StepsItem`) may read the root's state from context. Markup the caller writes
  gets the values through the function, in plain sight.
- **Don't reach into children** with `cloneElement` or by inspecting their types to inject
  props. It breaks as soon as the caller wraps a part.

## Why

A compound reads like the markup it renders. A new need is a new part or a different
arrangement, not another prop on an ever-longer list. The name of every piece says what you
get, so the call site documents itself. Render props keep the same honesty when a value has to
cross from the root into the caller's own markup.
