# The magazine's design system, copied

These files are the design system of Vedneměsíčník, copied unchanged from the design system's
artifact — `project/styles.css`, `project/components.css`, `project/tokens/*.css`,
`project/tokens/font-files/*.woff2` and `project/assets/og-share.jpg` of https://claude.ai/artifact/PqJtpBPrbbf3f9zEw3gMVD.

**Copied from version `1795610965-3ed7`** on 25 November 2026.

- **Do not edit them here.** A change goes into the design system first, and then the files are
  copied again, all of them, and the version above is updated. `docs/design-project.md` says
  why: the system is shared by the magazine, Fakturace and this app.
- **`styles.css` is the one entry.** `app/assets.ts` links it and the asset server rewrites its
  `@import` and `url()` references, the two fonts included.
- **oxfmt leaves this folder alone** (`.oxfmtrc.json`), so a refresh stays a byte-for-byte
  copy and its diff shows only what the design system changed.
- **Components write the markup, this styles it.** The design system's components are React,
  which this app does not run; a component in `app/ui/` writes the same `vdm-*` classes, as
  `app/ui/panel/` does for `AdminSidebar`.
