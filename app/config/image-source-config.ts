export const IMAGE_SOURCE = {
  EXISTING: 'existing',
  NEW: 'new',
} as const

export type ImageSource = (typeof IMAGE_SOURCE)[keyof typeof IMAGE_SOURCE]
