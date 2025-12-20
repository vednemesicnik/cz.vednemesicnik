import { z } from 'zod'

export const schema = z.object({
  authorId: z.string(),
  episodeId: z.string().readonly(),
  label: z.string({ message: 'Label is required' }),
  linkId: z.string().readonly(),
  podcastId: z.string().readonly(),
  url: z
    .string({ message: 'URL is required' })
    .url({ message: 'URL is not valid' }),
})
