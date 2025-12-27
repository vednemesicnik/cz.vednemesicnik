import { href } from 'react-router'

export function createArticleImageUrl(imageId: string) {
  return href('/resources/article-image/:imageId', { imageId })
}
