import { readFile } from 'node:fs/promises'

import { createId } from '@paralleldrive/cuid2'

import type { StoredImageMeta } from '~/utils/image-store/store-image.server'
import { storeImageVariants } from '~/utils/image-store/store-image.server'

type Args = {
  altText: string
  filePath: string
}

// Image-row data ready to spread into a nested Prisma `image: { create: ... }`
// (cover, featured image, avatar, …). The legacy `blob`/`contentType` columns are
// left null — the seed writes only pre-generated variants to the on-disk store.
export type SeedImage = { id: string; altText: string } & StoredImageMeta

// Generate the responsive variant matrix on the volume and return the row data.
// The id is generated up front so the variant files are written before the row is
// committed (files-before-DB), matching the admin create path (see e.g.
// app/routes/administration/archive/add-issue/_action.ts).
export const storeSeedImage = async ({
  altText,
  filePath,
}: Args): Promise<SeedImage> => {
  const buffer = await readFile(filePath)
  const id = createId()
  const meta = await storeImageVariants(id, buffer)

  return { altText, id, ...meta }
}
