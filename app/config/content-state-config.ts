import type { ContentState } from '@generated/prisma/enums'

type ContentStateConfig = {
  map: Record<ContentState, ContentState>
  selectMap: Record<ContentState, string>
  states: ContentState[]
}

export const contentStateConfig: ContentStateConfig = {
  map: {
    archived: 'archived',
    draft: 'draft',
    published: 'published',
  },
  selectMap: {
    archived: 'Archivováno',
    draft: 'Rozpracováno',
    published: 'Publikováno',
  },
  states: ['draft', 'published', 'archived'],
}
