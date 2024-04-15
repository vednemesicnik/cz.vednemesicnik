/**
 * Combines multiple styles into a single string
 * @param styles
 */
export const combineStyles = (...styles: (string | undefined)[]) => {
  return styles.join(" ")
}
