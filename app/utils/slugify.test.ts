import { describe, expect, test } from "vitest"

import { slugify } from "~/utils/slugify"

describe("slugify", () => {
  test("should convert string to lowercase", () => {
    expect(slugify("Example")).toBe("example")
  })

  test("should remove diacritics", () => {
    expect(slugify("éxámple")).toBe("example")
  })

  test("should replace spaces with hyphens", () => {
    expect(slugify("example test")).toBe("example-test")
  })

  test("should remove special characters except hyphens", () => {
    expect(slugify("example!@#-test")).toBe("example-test")
  })

  test("should handle a combination of transformations", () => {
    expect(slugify("Éxámple Test!@#")).toBe("example-test")
  })
})
