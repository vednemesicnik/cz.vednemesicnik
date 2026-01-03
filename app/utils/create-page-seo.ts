import type { MetaDescriptor } from 'react-router'
import { createPageTitle } from '~/utils/create-page-title'

export type Options = {
  /**
   * Page title (without site name suffix)
   */
  title: string

  /**
   * Meta description
   */
  description: string

  /**
   * Canonical URL for the page
   */
  url: string

  /**
   * Meta keywords (optional)
   */
  keywords?: string

  /**
   * Robots meta tag value (optional, defaults to 'index, follow')
   */
  robots?: string

  /**
   * Open Graph type (optional, defaults to 'website')
   */
  ogType?: string

  /**
   * Open Graph image URL (optional)
   */
  ogImage?: string

  /**
   * Twitter card type (optional, defaults to 'summary_large_image')
   */
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player'

  /**
   * Twitter image URL (optional, falls back to ogImage if not provided)
   */
  twitterImage?: string
}

/**
 * Creates an array of meta descriptors for React Router meta function.
 *
 * Generates standard meta tags including:
 * - Basic meta (title, description, keywords, robots, canonical)
 * - Open Graph meta tags
 * - Twitter Card meta tags
 *
 * @example
 * ```ts
 * export const meta: Route.MetaFunction = () => {
 *   return createPageSEO({
 *     title: 'Articles',
 *     description: 'Read our latest articles',
 *     url: new URL('/articles', ENV.BASE_URL).href,
 *     ogImage: 'https://example.com/og-image.jpg',
 *   })
 * }
 * ```
 */
export function createPageSEO({
  title,
  description,
  url,
  keywords,
  robots = 'index, follow',
  ogType = 'website',
  ogImage,
  twitterCard = 'summary_large_image',
  twitterImage,
}: Options): MetaDescriptor[] {
  const meta: MetaDescriptor[] = [
    // Basic meta tags
    { title: createPageTitle(title) },
    { content: description, name: 'description' },
    { content: robots, name: 'robots' },
    { href: url, rel: 'canonical', tagName: 'link' },

    // Open Graph meta tags
    { content: title, property: 'og:title' },
    { content: description, property: 'og:description' },
    { content: ogType, property: 'og:type' },
    { content: url, property: 'og:url' },

    // Twitter Card meta tags
    { content: twitterCard, name: 'twitter:card' },
    { content: title, name: 'twitter:title' },
    { content: description, name: 'twitter:description' },
  ]

  // Add optional keywords
  if (keywords) {
    meta.push({ content: keywords, name: 'keywords' })
  }

  // Add Open Graph image
  if (ogImage) {
    meta.push({ content: ogImage, property: 'og:image' })
  }

  // Add Twitter image (fallback to ogImage if not provided)
  const finalTwitterImage = twitterImage ?? ogImage
  if (finalTwitterImage) {
    meta.push({ content: finalTwitterImage, name: 'twitter:image' })
  }

  return meta
}
