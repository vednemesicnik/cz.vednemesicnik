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
  // Select only ids/names up front (not the blobs), and only rows that still hold
  // a blob, so memory stays bounded regardless of how many/large the PDFs are.
  const rows = await prisma.issuePDF.findMany({
    select: { fileName: true, id: true },
    where: { blob: { not: null } },
  })

  let copied = 0
  let skipped = 0

  for (const row of rows) {
    const key = buildPdfKey(row.id)

    // Idempotent: don't overwrite an object a previous run already wrote.
    if (await pdfStore.exists(key)) {
      console.log(`- ${row.fileName}: object already present, skipping`)
      skipped++
      continue
    }

    // Load just this row's blob, so only one PDF is held in memory at a time.
    const { blob } = await prisma.issuePDF.findUniqueOrThrow({
      select: { blob: true },
      where: { id: row.id },
    })
    // Narrows the nullable `blob` column for `put`; also guards the unlikely race
    // where the row was cleared between the id query and this one.
    if (blob === null) {
      skipped++
      continue
    }

    await pdfStore.put(key, blob, 'application/pdf')
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
