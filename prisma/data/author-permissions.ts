import type { AuthorPermissionsData } from '~~/utils/create-author-permissions'

export const authorPermissions: AuthorPermissionsData = {
  accesses: ['own', 'any'],
  actions: [
    'view',
    'create',
    'update',
    'delete',
    'publish',
    'retract',
    'archive',
    'restore',
    'review',
  ],
  entities: [
    'article',
    'article_category',
    'article_tag',
    'podcast',
    'podcast_episode',
    'issue',
  ],
  states: ['draft', 'published', 'archived'],
}
