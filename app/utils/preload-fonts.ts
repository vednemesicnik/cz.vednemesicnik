import type { LinkDescriptor } from "@remix-run/node"

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
  href: `/font/woff2/${font}.woff2`,
  crossOrigin: "anonymous",
})

export const preloadFonts = (...fonts: (keyof typeof fontMap)[]) =>
  fonts.map((font) => createLinkDescriptor(fontMap[font]))
