import { combineStyles } from "~/utils/combine-styles"

export const applyStyles = (...styles: string[]) => ({
  if: (condition: boolean) => {
    return condition ? combineStyles(...styles) : undefined
  },
})
