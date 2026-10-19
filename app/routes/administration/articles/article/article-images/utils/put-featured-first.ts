/**
 * The gallery's order with the main image first, where it stands on the web
 * and in the editor (design 24b, yj2t50dd); the others keep their order.
 *
 * @param ids - The images in their order.
 * @param featuredId - The main image, or `null` for none.
 * @returns A new list, unchanged when the main image is not in it.
 */
export const putFeaturedFirst = (
  ids: string[],
  featuredId: string | null,
): string[] =>
  featuredId === null || !ids.includes(featuredId)
    ? [...ids]
    : [featuredId, ...ids.filter((id) => id !== featuredId)]
