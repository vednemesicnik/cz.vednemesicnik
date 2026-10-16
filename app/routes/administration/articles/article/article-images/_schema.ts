import { z } from 'zod'

const imageId = z.string().min(1)

const text = z
  .string()
  .optional()
  .transform((value) => value?.trim() ?? '')

/** One change of the editor's gallery, saved on its own (design 24b). */
export const schema = z.intersection(
  z.discriminatedUnion('intent', [
    z.object({
      altText: text,
      description: text,
      file: z.instanceof(File),
      imageId,
      intent: z.literal('upload'),
    }),
    z.object({ imageId, intent: z.literal('remove') }),
    // Without an image: no main image, which is also a choice.
    z.object({
      imageId: imageId.optional(),
      intent: z.literal('feature'),
    }),
    z.object({
      imageIds: z.array(imageId).min(1),
      intent: z.literal('reorder'),
    }),
  ]),
  // The editor's tab, which holds the edit hold (design 24g).
  z.object({ editTabId: z.string().min(1) }),
)

/** A gallery change as the editor sends it. */
export type ArticleImageChange = z.input<typeof schema>
