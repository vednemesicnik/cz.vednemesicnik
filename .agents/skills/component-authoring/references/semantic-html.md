# Semantic HTML

## Pick the element by meaning, then style it

Before reaching for `<div>`, ask what the part is. The browser, a screen reader
and a search engine read the element; none of them reads the class name.

| The part is…                                   | Use                                   |
| ---------------------------------------------- | ------------------------------------- |
| a page's or section's heading block            | `<header>` (with the `<h1>`–`<h6>`)   |
| a set of links between pages or tabs           | `<nav>` with a list                   |
| the page's own content                         | `<main>` (once per page)              |
| a self-contained piece (a post, a card)        | `<article>`                           |
| a titled part of the page                      | `<section>` with a heading            |
| side information beside the main content       | `<aside>`                             |
| search and filters                             | `<search>`                            |
| rows and columns of data                       | `<table>`, `<thead>`, `<th scope>`    |
| a list of like items                           | `<ul>` / `<ol>`                       |
| pairs of a name and a value                    | `<dl>`, `<dt>`, `<dd>`                |
| an image with its caption                      | `<figure>`, `<figcaption>`            |
| a date or time                                 | `<time dateTime>`                     |

```tsx
// bad — a heading block and a data list that say nothing about themselves
<div className={styles.top}>
  <div className={styles.title}>Recepty</div>
  <div className={styles.count}>12 receptů</div>
</div>
<div className={styles.rows}>
  <div className={styles.row}>
    <div>Bábovka</div>
    <div>3. 4. 2026</div>
  </div>
</div>

// good — the same layout, with elements that carry the meaning
<header className={styles.top}>
  <h1>Recepty</h1>
  <p className={styles.count}>12 receptů</p>
</header>
<table className={styles.rows}>
  <thead>
    <tr>
      <th scope="col">Název</th>
      <th scope="col">Upraveno</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Bábovka</td>
      <td><time dateTime="2026-04-03">3. 4. 2026</time></td>
    </tr>
  </tbody>
</table>
```

- **A table that must lay out as a grid** keeps its elements and gets
  `display: grid` (with `subgrid` for the rows), or stays a `<div>` structure with
  `role="table"`, `role="row"`, `role="columnheader"` and `role="cell"`. Prefer the
  real elements.
- **A `<button>` acts, an `<a>` goes somewhere.** Never a clickable `<div>`.
- **A component renders the element its role needs** and takes `className` for the
  look; the place that uses it doesn't wrap it in another `<div>`.
- **ARIA only where no element fits.** A native element brings its role, keyboard
  behaviour and states with it.

## Why

A page of `<div>`s looks right and reads as nothing: a screen reader can't jump to
the main content, list the headings or read a row with its column names, and the
browser's own features (reader mode, find in table, landmarks) have nothing to hold.
The right element costs nothing, because the CSS is the same.
