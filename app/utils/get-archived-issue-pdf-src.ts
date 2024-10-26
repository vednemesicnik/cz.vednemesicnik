export function getArchivedIssuePdfSrc(fileName: string) {
  return `/archive/${fileName}` as const
}
