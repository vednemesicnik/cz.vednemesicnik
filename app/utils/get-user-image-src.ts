export function getUserImageSrc(id: string) {
  return `/resources/user-image/${id}` as const
}
