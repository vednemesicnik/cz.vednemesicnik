// The files of an archive issue, refused already at selection (design 26d).
export const ISSUE_FILE_CONFIG = {
  cover: { maxFileBytes: 5 * 1024 * 1024 },
  pdf: { contentType: 'application/pdf', maxFileBytes: 10 * 1024 * 1024 },
} as const
