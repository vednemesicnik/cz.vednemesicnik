export function getIssuePdfSrc(fileName: string) {
  return `/archive/${fileName}` as const
}
