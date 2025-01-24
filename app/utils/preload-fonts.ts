import type { LinkDescriptor } from "react-router"

const fontMap = {
  regular: "IBMPlexSans-Regular",
  text: "IBMPlexSans-Text",
  medium: "IBMPlexSans-Medium",
  semiBold: "IBMPlexSans-SemiBold",
  bold: "IBMPlexSans-Bold",
}

const createLinkDescriptor = (font: string): LinkDescriptor => ({
  rel: "preload",
  as: "font",
  type: "font/woff2",
  href: `/fonts/${font}.woff2?v=1.1.0`,
  crossOrigin: "anonymous",
})

export const preloadFonts = (...fonts: (keyof typeof fontMap)[]) =>
  fonts.map((font) => createLinkDescriptor(fontMap[font]))
