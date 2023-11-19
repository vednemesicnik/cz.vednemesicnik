export const applyStyles = (...styles: string[]) => ({
  if: (condition: boolean) => {
    return condition ? styles.join(" ") : undefined
  },
})
