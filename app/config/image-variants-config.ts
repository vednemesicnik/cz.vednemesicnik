// Canonical, design-agnostic responsive width ladder. Variants are pre-generated
// per width preserving the natural aspect ratio (no upscaling: only widths <= the
// image's intrinsic width are produced, so the largest variant is effectively the
// "original"). DPR/retina is handled by the browser via `w` descriptors, so no
// dedicated 1x/2x variants are needed.
export const IMAGE_VARIANT_WIDTHS = [320, 640, 960, 1280, 1920] as const

export type ImageVariantWidth = (typeof IMAGE_VARIANT_WIDTHS)[number]

// Delivered formats: AVIF (primary, ~95%+ browser support) + JPEG (fallback).
// WebP is intentionally dropped — its only benefit is browsers that support WebP
// but not AVIF; those fall back to JPEG, which is functionally fine.
export const IMAGE_VARIANT_FORMATS = ['avif', 'jpeg'] as const

export type ImageVariantFormat = (typeof IMAGE_VARIANT_FORMATS)[number]

// Content type per delivered format.
export const IMAGE_CONTENT_TYPE = {
  avif: 'image/avif',
  jpeg: 'image/jpeg',
} as const satisfies Record<ImageVariantFormat, string>

// The only dedicated cropped variant, used for social/OG cards (fixed landscape).
export const OG_IMAGE_SIZE = { height: 630, width: 1200 } as const

// Approximate width (px) of the inline blurred LQIP placeholder stored in the DB.
export const LQIP_WIDTH = 20
