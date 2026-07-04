#!/usr/bin/env tsx
// One-time backfill: copy each IssuePDF.blob out of SQLite and into the pdf object
// store (volume or Tigris, per STORE_DRIVER). Idempotent — it skips rows whose
// object already exists — so it is safe to re-run.
//
// Run once per environment AFTER the store-writing code is deployed and BEFORE the
// follow-up migration drops the blob column (issue #108).
//
// In production run the pre-bundled build from the app machine (no `tsx`/`app/`
// source needed in the image — see vite.backfill.config.ts):
//   pnpm backfill:issue-pdfs:built      # = node build/backfill-issue-pdfs.mjs
// Locally:
//   pnpm backfill:issue-pdfs            # = tsx scripts/backfill-issue-pdfs.ts

import 'dotenv/config'

import { prisma } from '~/utils/db.server'
import { buildPdfKey } from '~/utils/pdf-store/pdf-key'
import { pdfStore } from '~/utils/pdf-store/pdf-store.server'

async function backfill() {
  const rows = await prisma.issuePDF.findMany({
    select: { blob: true, fileName: true, id: true },
  })

  let copied = 0
  let skipped = 0

  for (const row of rows) {
    const key = buildPdfKey(row.id)

    // Already store-only (uploaded after the cutover) — nothing to copy.
    if (row.blob === null) {
      console.log(`- ${row.fileName}: no blob, skipping`)
      skipped++
      continue
    }

    // Idempotent: don't overwrite an object a previous run already wrote.
    if (await pdfStore.exists(key)) {
      console.log(`- ${row.fileName}: object already present, skipping`)
      skipped++
      continue
    }

    await pdfStore.put(key, row.blob, 'application/pdf')
    console.log(`✓ ${row.fileName} → ${key}`)
    copied++
  }

  console.log(
    `\nDone. Copied ${copied}, skipped ${skipped}, total ${rows.length}.`,
  )
}

backfill()
  .catch((error) => {
    console.error('Backfill failed:', error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
