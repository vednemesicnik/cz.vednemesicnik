/** Which of the issue's two files a sentence is about. */
export type IssueFiles = { cover: boolean; pdf: boolean }

type Sentences = {
  cover: string
  pdf: string
  both: string
}

/**
 * Picks the sentence for the cover, the PDF or both (design 26c, 26d).
 *
 * @param files - Which files the sentence names.
 * @param sentences - The sentence for each case.
 * @returns The sentence, or `null` when it names neither.
 */
export const formatIssueFilesSentence = (
  files: IssueFiles,
  sentences: Sentences,
): string | null =>
  files.cover && files.pdf
    ? sentences.both
    : files.cover
      ? sentences.cover
      : files.pdf
        ? sentences.pdf
        : null
