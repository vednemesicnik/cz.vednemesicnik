import { href } from 'react-router'

export function createArticleImageUrl(imageId: string | undefined = undefined) {
  return imageId === undefined
    ? undefined
    : href('/resources/article-image/:imageId', { imageId })
}
