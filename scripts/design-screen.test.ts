import { describe, expect, test } from 'vitest'

import {
  documentFrom,
  findScreen,
  notesOf,
  screensIn,
  textOf,
} from './design-screen'

// This app's markup, cut to what the script reads: an intro section without an
// anchor, two screens whose drawings nest sections of their own, an intro
// paragraph and lead-note paragraphs, and a trailing section that is no screen.
const SECTION_DOCUMENT = `
<section><p>Legenda.</p></section>
<section id="22a" style="display:flex">
  <span>OBRAZOVKA</span>
  <div><span style="font-weight:700">22a</span><span>Seznam článků</span><span>návrh</span></div>
  <p style="margin:0">Úvod ke kresbě.</p>
  <div class="drawing"><section><p>Nový článek</p></section></div>
  <div><p><strong>Jedna akce na řádku.</strong> Rozhodnuto&nbsp;27. 9. 2026.</p></div>
</section>
<section id="22b">
  <div><span>22b</span> <span>Buňka Stav</span></div>
  <p><strong>Co role nesmí, se nekreslí.</strong> &lt;select&gt; &amp; „⋯“.</p>
</section>
<section><p><strong>Otevřené.</strong> Stránkování.</p></section>
`

// The billing markup: a turn, two `dv-opt` screens with `dv-note` notes, and a
// second turn that must not leak into the screen before it.
const OPTION_DOCUMENT = `
<section class="dv-turn">
  <p class="dv-note">O celé kartě.</p>
  <div class="dv-opt" id="7e">
    <a class="dv-oid" href="#7e">7e</a>
    <span>Odepsat</span>
    <section class="card"><label>Datum odpisu</label></section>
    <p class="dv-note">Určuje rok uvedený u odpisu.</p>
  </div>
</section>
<section class="dv-turn">
  <div class="dv-opt" id="9g"><a class="dv-oid" href="#9g">9g</a> <span>Rámec</span></div>
</section>
`

describe('design-screen', () => {
  test('finds every anchored section in order, each by its drawn label', () => {
    expect(
      screensIn(SECTION_DOCUMENT).map((screen) => [screen.id, screen.label]),
    ).toEqual([
      ['22a', 'Seznam článků'],
      ['22b', 'Buňka Stav'],
    ])
  })

  // The drawing inside 22a nests a <section>; ending the screen there would
  // lose its notes, and running past its own end would take the next section's.
  test('ends a section screen at its own closing tag, past nested sections', () => {
    const [list, cell] = screensIn(SECTION_DOCUMENT)

    expect(notesOf(list)).toEqual([
      'Jedna akce na řádku. Rozhodnuto 27. 9. 2026.',
    ])
    expect(notesOf(cell)).toEqual([
      'Co role nesmí, se nekreslí. <select> & „⋯“.',
    ])
    expect(cell.html).not.toContain('Otevřené')
  })

  test('reads billing dv-opt screens and stops at the next turn', () => {
    const screens = screensIn(OPTION_DOCUMENT)

    expect(screens.map((screen) => [screen.id, screen.label])).toEqual([
      ['7e', 'Odepsat'],
      ['9g', 'Rámec'],
    ])
    expect(notesOf(screens[0])).toEqual(['Určuje rok uvedený u odpisu.'])
    expect(screens[0].html).not.toContain('9g')
  })

  test('finds a screen by its anchor or its label, whatever the case', () => {
    const screens = screensIn(SECTION_DOCUMENT)

    expect(findScreen(screens, '22b')?.label).toBe('Buňka Stav')
    expect(findScreen(screens, 'seznam článků')?.id).toBe('22a')
    expect(findScreen(screens, '22z')).toBeUndefined()
  })

  // What the harness saves is the JSON `get_file` returned, not the document.
  test('reads a saved get_file result as well as the document itself', () => {
    const saved = JSON.stringify({
      content: SECTION_DOCUMENT,
      method: 'get_file',
      path: '22 Seznam článků.dc.html',
    })

    expect(documentFrom(saved)).toBe(SECTION_DOCUMENT)
    expect(documentFrom(SECTION_DOCUMENT)).toBe(SECTION_DOCUMENT)
    expect(() => documentFrom('{"method":"list_files"}')).toThrow(/content/)
  })

  test('turns markup into reading text, one block to a line', () => {
    expect(
      textOf('<p>a&nbsp;b</p><div>c &#8211; d</div><style>x{}</style>'),
    ).toBe('a b\nc – d')
  })
})
