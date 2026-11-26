import { IMAGE_VARIANT_WIDTHS } from '~/config/image-variants-config'

// The widths actually generated/stored for an image: the canonical ladder capped
// at the intrinsic width (no upscaling). Images smaller than the smallest ladder
// step still get a single variant at their intrinsic width. Both the generator
// (write) and the srcset builder (read) rely on this being deterministic so the
// URLs a page emits always match files that exist on disk.
export function selectVariantWidths(intrinsicWidth: number): number[] {
  const withinLadder = IMAGE_VARIANT_WIDTHS.filter(
    (width) => width <= intrinsicWidth,
  )
  return withinLadder.length > 0 ? withinLadder : [intrinsicWidth]
}
