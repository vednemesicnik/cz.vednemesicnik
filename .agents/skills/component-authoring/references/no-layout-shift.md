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

## Why

A shift moves the thing the person was about to read or click: they lose their
place or hit the wrong button. It also counts against Cumulative Layout Shift, a
Core Web Vital. A slot decided in CSS costs nothing; a jump costs trust every time
it happens.
