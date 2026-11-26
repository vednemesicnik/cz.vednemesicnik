---
name: no-layout-shift
description: |
  Anything that can come and go must not push, pull or re-centre its neighbours.

  Trigger for:
  - Rendering a piece conditionally — a count, a hint, a banner, a button, an error
  - Aligning items in a row where an item's height can change
  - Adding an image, an embed or anything that loads after the page

  DO NOT trigger for:
  - A move the person caused and expects: opening a disclosure, expanding a row
  - Which mechanism holds the layout, which is `layout`
---

# No Layout Shift

The names below are invented; they illustrate the pattern, not code of the app.

## Decide where things stand before the data decides

Check every conditional piece: _if it vanished right now, would anything else move?_

```tsx
// bad — the button is centred against a column whose height depends on the hint
const headerStyle = css({ alignItems: 'center', display: 'flex' })

<header mix={headerStyle}>
  <div>
    <h1>{tied`Přihlášky`}</h1>
    {waitingCount > 0 && <a href="?state=waiting">{tied`${waitingCount} čeká`}</a>}
  </div>
  <button type="submit">{tied`Nová přihláška`}</button>
</header>

// good — the button aligns to the heading line, which is always there
const headerStyle = css({ alignItems: 'start', display: 'flex' })
```

- **Align to what always exists.** In a row, align items to the line that is always there
  (`alignItems: 'start'` or `'baseline'`), never `'center'` against something that can appear.
- **Reserve the space** when the piece sits above other content: a fixed slot (`minBlockSize`),
  `visibility: 'hidden'` instead of not rendering, or a placeholder of the same size while it
  loads.
- **Give media its size up front**: `width` and `height` attributes or `aspectRatio` on images,
  video and embeds, so the box exists before the bytes.
- **Live updates keep rows put.** A list that changes in place (a state, a count) updates the
  row; it does not reorder or resize what the person is looking at.
- **Prefer an overlay for transient messages** (a toast, a popover) over text inserted into the
  flow; an overlay is out of flow by the `layout` rule's reasoning.
- **An island hydrates into the size it was served at.** The server renders the same box the
  island keeps, so nothing jumps when the script arrives.

## Why

A shift moves the thing the person was about to read or click: they lose their place or hit the
wrong button. A slot decided in CSS costs nothing; a jump costs trust every time it happens.
