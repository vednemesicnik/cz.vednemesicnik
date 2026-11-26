# No Layout Shift

## Decide where things stand before the data decides

Anything that can come and go — a line of text, a count, a button, a loaded image
— must not push, pull or re-center its neighbours. Check every conditional piece:
_if it vanished right now, would anything else move?_

```tsx
// bad — the button is centered against a column whose height depends on the hint
<header className={styles.header}> {/* align-items: center */}
  <div>
    <h1>Objednávky</h1>
    {waitingCount > 0 && <a href="?state=waiting">{waitingCount} čeká</a>}
  </div>
  <Button>Nová objednávka</Button>
</header>

// good — the button aligns to the heading line, which is always there
<header className={styles.header}> {/* align-items: start */}
  <div>
    <h1>Objednávky</h1>
    {waitingCount > 0 && <a href="?state=waiting">{waitingCount} čeká</a>}
  </div>
  <Button className={styles.newOrder}>Nová objednávka</Button>
</header>
```

- **Align to what always exists.** In a row, align items to the line that is always
  there (`align-items: start` or `baseline`), never `center` against something that
  can appear.
- **Reserve the space** when the piece sits above other content: a fixed slot
  (`min-block-size`), `visibility: hidden` instead of not rendering, or a
  placeholder of the same size while it loads.
- **Give media its size up front**: `width` and `height` attributes or
  `aspect-ratio` on images, video and embeds, so the box exists before the bytes.
- **Live updates keep rows put.** A list that changes in place (a status, a count)
  updates the row; it doesn't reorder or resize what the person is looking at.
- **Prefer an overlay for transient messages** (a toast, a popover) over text
  inserted into the flow.
- **Not a shift:** a move the person caused and expects — opening a disclosure,
  expanding a row.

## Rows and tracks that hold text

- **A flexible track is `minmax(0, 1fr)`, and a flex item holding text sets `min-width: 0`.**
  `1fr` means `minmax(auto, 1fr)`, and an item's automatic minimum is its min-content, so one
  long unbroken string — an e-mail address, a URL — widens the track and the page instead of
  wrapping inside it.
- **Flex cannot align across siblings.** `margin-inline-start: auto` pushes an item to the end
  of its own line, but each flex row shares out its own space, so items in separate rows never
  form a column. When things must line up, one grid owns every row (`subgrid` for rows that
  are separate components).

```css
/* bad — a flex row per pair, so no two values start at the same place */
.row {
  @layer component {
    display: flex;
    gap: 0.5rem;
  }
}

/* good — one grid over the list: the label column is shared, the value track may shrink */
.rows {
  @layer component {
    display: grid;
    grid-template-columns: minmax(0, auto) minmax(0, 1fr);
    align-items: baseline;
  }
}
```

## Why

A shift moves the thing the person was about to read or click: they lose their
place or hit the wrong button. It also counts against Cumulative Layout Shift, a
Core Web Vital. A slot decided in CSS costs nothing; a jump costs trust every time
it happens.
