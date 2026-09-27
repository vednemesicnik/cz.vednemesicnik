#!/usr/bin/env tsx
import { readFile } from 'node:fs/promises'

/**
 * Prints one screen out of a Claude Design document, by its anchor — `22a`, not
 * `22 Seznam článků.dc.html`.
 *
 * A `.dc.html` runs to tens of kilobytes and a question about the app needs one
 * screen of it. Read through `DesignSync get_file` in the main session, a result
 * that size is not put into the conversation: the harness saves it to a file and
 * shows a short preview. This reads that file — or a plain `.dc.html` — and
 * prints only what was asked for.
 *
 * Usage:
 *   pnpm design:screen <file>                 the screens it holds, one per line
 *   pnpm design:screen <file> 22a [22b …]     each screen as text, notes included
 *   pnpm design:screen <file> 22a --notes     only the screen's notes
 *   pnpm design:screen <file> 22a --html      the markup, for a grid or a style
 *
 * Two markups are recognised. This app's documents draw a screen as
 * `<section id="22a">` with the anchor in a badge `<span>` and the screen's
 * name in the next `<span>`; its notes are the paragraphs that open with a
 * `<strong>` lead. The billing project's documents use `<div class="dv-opt">`
 * screens with `<p class="dv-note">` notes. See `docs/_design-project.md`.
 */

export type Screen = {
  html: string
  id: string
  label: string
}

type Start = { at: number; id: string; kind: 'section' | 'option' }

const SECTION_SCREEN = /<section\b[^>]*\bid="(\d+[a-z]+)"/g
const OPTION_SCREEN = /<div class="dv-opt"[^>]*\bid="([^"]+)"/g
const TURN = '<section class="dv-turn"'
const OPTION_NOTE = /<p class="dv-note"[^>]*>[\s\S]*?<\/p>/g
const LEAD_NOTE = /<p\b[^>]*>\s*<strong\b[\s\S]*?<\/p>/g
const OPTION_LABEL =
  /class="dv-oid"[^>]*>[^<]*<\/a>\s*<span[^>]*>([\s\S]*?)<\/span>/
const SECTION_OPEN = /<section\b|<\/section>/g

/**
 * Takes the document out of whatever holds it.
 *
 * @param raw - A saved `get_file` result (JSON with the document as `content`)
 *   or the document itself.
 * @returns The document's HTML.
 */
export const documentFrom = (raw: string): string => {
  if (!raw.trimStart().startsWith('{')) return raw

  const parsed: unknown = JSON.parse(raw)
  if (typeof parsed === 'object' && parsed !== null && 'content' in parsed) {
    const { content } = parsed as { content: unknown }
    if (typeof content === 'string') return content
  }
  throw new Error('JSON without a string `content` — not a get_file result')
}

const escapeForPattern = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Index just past the `</section>` that closes the section opened at `start`. */
const sectionEnd = (document: string, start: number): number => {
  let depth = 0
  for (const match of document.matchAll(SECTION_OPEN)) {
    if (match.index < start) continue
    depth += match[0] === '</section>' ? -1 : 1
    if (depth === 0) return match.index + match[0].length
  }
  return document.length
}

const labelOf = (html: string, start: Start): string => {
  if (start.kind === 'option') return OPTION_LABEL.exec(html)?.[1] ?? ''

  const badge = new RegExp(
    `<span[^>]*>\\s*${escapeForPattern(start.id)}\\s*</span>\\s*<span[^>]*>([\\s\\S]*?)</span>`,
  )
  return badge.exec(html)?.[1] ?? ''
}

/**
 * Finds every screen in document order.
 *
 * A `<section id>` screen runs to its own closing tag. A `dv-opt` screen runs
 * to the next screen or the next turn, whichever comes first.
 *
 * @param document - The document's HTML.
 * @returns The screens with their anchor, drawn label and markup.
 */
export const screensIn = (document: string): Screen[] => {
  const starts: Start[] = [
    ...[...document.matchAll(SECTION_SCREEN)].map(
      (match): Start => ({ at: match.index, id: match[1], kind: 'section' }),
    ),
    ...[...document.matchAll(OPTION_SCREEN)].map(
      (match): Start => ({ at: match.index, id: match[1], kind: 'option' }),
    ),
  ].sort((left, right) => left.at - right.at)

  return starts.map((start, index) => {
    const next = starts[index + 1]?.at ?? document.length
    let end = next
    if (start.kind === 'section') {
      end = Math.min(next, sectionEnd(document, start.at))
    } else {
      const turn = document.indexOf(TURN, start.at)
      if (turn !== -1) end = Math.min(next, turn)
    }
    const html = document.slice(start.at, end)

    return {
      html,
      id: start.id,
      label: textOf(labelOf(html, start)).replace(/\s+/g, ' ').trim(),
    }
  })
}

/**
 * Finds a screen by its anchor, or by its label, ignoring case.
 *
 * @param screens - The screens {@link screensIn} returned.
 * @param wanted - An anchor such as `22a`, or a screen's label.
 * @returns The screen, or `undefined` when none matches.
 */
export const findScreen = (
  screens: readonly Screen[],
  wanted: string,
): Screen | undefined => {
  const folded = wanted.toLowerCase()
  return (
    screens.find((screen) => screen.id === wanted) ??
    screens.find(
      (screen) =>
        screen.id.toLowerCase() === folded ||
        screen.label.toLowerCase() === folded,
    )
  )
}

/**
 * Lists a screen's notes as text: `dv-note` paragraphs where the document has
 * them, otherwise the paragraphs that open with a `<strong>` lead.
 *
 * @param screen - One of the screens {@link screensIn} returned.
 * @returns One string per note.
 */
export const notesOf = (screen: Screen): string[] => {
  const optionNotes = [...screen.html.matchAll(OPTION_NOTE)]
  const notes =
    optionNotes.length > 0 ? optionNotes : [...screen.html.matchAll(LEAD_NOTE)]
  return notes.map((match) => textOf(match[0]).trim())
}

/**
 * Turns markup into reading text: blocks become lines, tags go, and the
 * entities the documents use are decoded.
 *
 * @param html - Any fragment of a document.
 * @returns Plain text, one block to a line.
 */
export const textOf = (html: string): string =>
  html
    .replace(/<(style|script)\b[\s\S]*?<\/\1>/g, '')
    .replace(/<br\s*\/?>|<\/(p|div|li|h\d|tr|section|aside|header)>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number(code)),
    )
    .replace(/&amp;/g, '&')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n\s*/g, '\n')
    .trim()

const main = async (): Promise<void> => {
  const [file, ...rest] = process.argv.slice(2)
  if (file === undefined) {
    console.error(
      'Usage: pnpm design:screen <file> [<screen id> …] [--notes | --html]',
    )
    process.exitCode = 1
    return
  }

  const wantsNotes = rest.includes('--notes')
  const wantsHtml = rest.includes('--html')
  if (wantsNotes && wantsHtml) {
    console.error('Use either --notes or --html, not both.')
    process.exitCode = 1
    return
  }
  const identifiers = rest.filter((argument) => !argument.startsWith('--'))
  const screens = screensIn(documentFrom(await readFile(file, 'utf8')))

  if (identifiers.length === 0) {
    for (const screen of screens) {
      console.log(
        `${screen.id}\t${notesOf(screen).length} notes\t${screen.label}`,
      )
    }
    return
  }

  for (const identifier of identifiers) {
    const screen = findScreen(screens, identifier)
    if (screen === undefined) {
      console.error(
        `No screen ${identifier} — this document holds ${screens.map((candidate) => candidate.id).join(', ')}`,
      )
      process.exitCode = 1
      continue
    }

    console.log(`=== ${screen.id} · ${screen.label}`)
    if (wantsHtml) console.log(screen.html)
    else if (wantsNotes) console.log(notesOf(screen).join('\n\n'))
    else console.log(textOf(screen.html))
  }
}

if (import.meta.main) await main()
