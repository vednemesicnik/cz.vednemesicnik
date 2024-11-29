export function getIssueCoverSrc(id: string) {
  return `/resources/issue-cover/${id}` as const
}
