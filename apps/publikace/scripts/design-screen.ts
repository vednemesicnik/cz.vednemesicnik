import { readFile } from 'node:fs/promises'

/*
 * One screen out of a saved design file, as text. The canvas pages are tens of kilobytes of
 * markup and a plan or a question needs one anchor of them; `Artifact` `read` saves the file
 * without putting it into the conversation, and this prints only the part that is asked for.
 *
 * A screen is `<section id="12b" class="sec">` and runs to the next one. Its label is the
 * section's `.ht` heading, its notes are the `.dec` decision paragraphs and the `.anno` notes
 * that do not print (the page chrome of `project/navrh.css` in the design canvas).
 *
 *   pnpm -s design:screen <file>                  every screen: id, notes, label
 *   pnpm -s design:screen <file> 12b              one screen as text, notes included
 *   pnpm -s design:screen <file> 12b 21a --notes  only their notes
 *   pnpm -s design:screen <file> 12b --html       the markup, for a grid or a style
 */

export type Screen = {
  html: string
  id: string
  label: string
}

const SECTION = /<section id="([^"]+)" class="sec"/g
const PAGE_END = '</x-dc>'
const LABEL = /<span class="ht">([\s\S]*?)<\/span>/
const DECISION = /<div class="dec"[^>]*>([\s\S]*?)<\/div>/g
const PARAGRAPH = /<p[^>]*>([\s\S]*?)<\/p>/g
const ANNOTATION = /<span class="anno"[^>]*>([\s\S]*?)<\/span>/g

export function screensIn(document: string): Screen[] {
  /* Screens nest sections of their own (a drawn page has `<section>`s inside), so a screen runs
     from its start to the next screen's start rather than to the first `</section>`. */
  let starts = [...document.matchAll(SECTION)]
  let end = document.indexOf(PAGE_END)
  return starts.map((match, index) => {
    let html = document.slice(
      match.index,
      starts[index + 1]?.index ?? (end === -1 ? undefined : end),
    )
    let label = LABEL.exec(html)?.[1] ?? ''
    return { html, id: match[1]!, label: textOf(label).replace(/\s+/g, ' ').trim() }
  })
}

export function findScreen(screens: readonly Screen[], wanted: string): Screen | undefined {
  let folded = wanted.toLowerCase()
  return (
    screens.find((screen) => screen.id === wanted) ??
    screens.find(
      (screen) => screen.id.toLowerCase() === folded || screen.label.toLowerCase() === folded,
    )
  )
}

export function notesOf(screen: Screen): string[] {
  let decisions = [...screen.html.matchAll(DECISION)].flatMap((block) =>
    [...block[1]!.matchAll(PARAGRAPH)].map((paragraph) => textOf(paragraph[1]!)),
  )
  let annotations = [...screen.html.matchAll(ANNOTATION)].map((note) => textOf(note[1]!))
  return [...decisions, ...annotations].filter((note) => note !== '')
}

export function textOf(html: string): string {
  return html
    .replace(/<(style|script)\b[\s\S]*?<\/\1>/g, '')
    .replace(/<br\s*\/?>|<\/(p|div|li|h\d|tr|section)>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&amp;/g, '&')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n[\s]*/g, '\n')
    .trim()
}

async function main(): Promise<void> {
  let [file, ...rest] = process.argv.slice(2)
  if (file === undefined) {
    console.error('Usage: pnpm design:screen <file> [<screen id> …] [--notes | --html]')
    process.exitCode = 1
    return
  }

  let wantsNotes = rest.includes('--notes')
  let wantsHtml = rest.includes('--html')
  let ids = rest.filter((arg) => !arg.startsWith('--'))
  let screens = screensIn(await readFile(file, 'utf8'))

  if (ids.length === 0) {
    for (let screen of screens) {
      console.log(`${screen.id}\t${notesOf(screen).length} notes\t${screen.label}`)
    }
    return
  }

  for (let id of ids) {
    let screen = findScreen(screens, id)
    if (screen === undefined) {
      console.error(`No screen ${id} in ${file}`)
      process.exitCode = 1
      continue
    }
    if (wantsHtml) console.log(screen.html)
    else if (wantsNotes) console.log(notesOf(screen).join('\n\n'))
    else console.log(textOf(screen.html))
  }
}

if (import.meta.main) await main()
