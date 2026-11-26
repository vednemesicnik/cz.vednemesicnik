import { href } from 'react-router'

import type { ImageVariantFormat } from '~/config/image-variants-config'

import { OG_VARIANT_NAME } from './image-key'

// Public resource-route kinds. Each maps to /resources/<kind>/... served by the
// matching loader in app/routes/resources/<kind>.
export type ImageResourceKind =
  | 'article-image'
  | 'issue-cover'
  | 'podcast-cover'
  | 'podcast-episode-cover'
  | 'user-image'

// Build a typed resource URL for one variant of an image. The three routes use
// different id param names (imageId vs coverId), so each kind is spelled out to
// keep `href`'s route-vs-params type checking intact.
function buildImageUrl(
  kind: ImageResourceKind,
  id: string,
  version: string,
  variant: string,
) {
  switch (kind) {
    case 'article-image':
      return href('/resources/article-image/:imageId/:version/:variant', {
        imageId: id,
        variant,
        version,
      })
    case 'user-image':
      return href('/resources/user-image/:imageId/:version/:variant', {
        imageId: id,
        variant,
        version,
      })
    case 'issue-cover':
      return href('/resources/issue-cover/:coverId/:version/:variant', {
        coverId: id,
        variant,
        version,
      })
    case 'podcast-cover':
      return href('/resources/podcast-cover/:coverId/:version/:variant', {
        coverId: id,
        variant,
        version,
      })
    case 'podcast-episode-cover':
      return href(
        '/resources/podcast-episode-cover/:coverId/:version/:variant',
        { coverId: id, variant, version },
      )
  }
}

// Public URL of a single responsive width variant.
export function buildImageVariantUrl(
  kind: ImageResourceKind,
  id: string,
  version: string,
  width: number,
  format: ImageVariantFormat,
) {
  return buildImageUrl(kind, id, version, `${width}.${format}`)
}

// Public URL of the dedicated OG/social crop.
export function buildOgImageUrl(
  kind: ImageResourceKind,
  id: string,
  version: string,
) {
  return buildImageUrl(kind, id, version, OG_VARIANT_NAME)
}
