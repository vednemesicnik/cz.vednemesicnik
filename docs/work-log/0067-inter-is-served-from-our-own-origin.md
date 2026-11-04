# 0067. Inter is served from our own origin

- Date: 2026-11-04

## Context

The app loaded its only typeface through a stylesheet in the document head from
`rsms.me/inter/inter.css`. An outage of rsms.me was harmless, because text fell back to
`sans-serif`. A stall was not: a stylesheet in the head holds up first paint until it times
out. Every reader's address also went to a third party.

## Outcome

`app/styles/fonts/` holds the unmodified `InterVariable` v4.1 files from rsms.me, renamed to
kebab-case. `app/styles/fonts.css` declares them, so Vite fingerprints them into `/assets/`,
where `react-router-serve` sends `immutable` with a one-year `max-age`. `app/root.tsx`
preloads the upright file, which every page uses; the italic file loads on demand.

The fonts are under the SIL Open Font License 1.1, whose FAQ counts web use as distribution.
Each file's `name` table carries the copyright and a licence statement with a link, a preserved
comment in the built CSS names them, and the full text is served at
`/licenses/inter-ofl.txt`. The licence asks for no credit on the page.

`--font-family` names only `InterVariable`. The static `Inter` faces came from the stylesheet
we dropped. Of the browsers in `.browserslistrc`, only KaiOS 2.5 and Opera Mini lack variable
fonts, and they keep the `sans-serif` fallback or the default cut.

## What follows

An upgrade replaces the two files and the version in the `global.css` comment, and replaces
the licence text if it changed. Subsetting the files would count as a modification under the
licence and needs the metadata kept, so a smaller file is a reason to reread it, not a build
step to add.

## Turned down

- **A backup next to the rsms.me link.** It would not help a stall, the case that hurts.
- **Google Fonts.** It is the same third party and the same readers' addresses going out, and
  design btiprlvb saw no working `opsz` axis in the file it loaded there.
- **The files in `public/`.** `react-router-serve` serves the copy Vite puts in `build/client`
  without a `max-age`, so every visit would revalidate, whatever the path says.
