import { describe, expect, it } from 'vitest'
import { createPageSEO } from './create-page-seo'

describe('createPageSEO', () => {
  it('should create basic meta tags with required fields', () => {
    const result = createPageSEO({
      description: 'Test description',
      title: 'Test Page',
      url: 'https://example.com/test',
    })

    expect(result).toContainEqual({ title: 'Test Page | Vedneměsíčník' })
    expect(result).toContainEqual({
      content: 'Test description',
      name: 'description',
    })
    expect(result).toContainEqual({
      content: 'index, follow',
      name: 'robots',
    })
    expect(result).toContainEqual({
      href: 'https://example.com/test',
      rel: 'canonical',
      tagName: 'link',
    })
  })

  it('should create Open Graph meta tags', () => {
    const result = createPageSEO({
      description: 'Test description',
      title: 'Test Page',
      url: 'https://example.com/test',
    })

    expect(result).toContainEqual({
      content: 'Test Page',
      property: 'og:title',
    })
    expect(result).toContainEqual({
      content: 'Test description',
      property: 'og:description',
    })
    expect(result).toContainEqual({
      content: 'website',
      property: 'og:type',
    })
    expect(result).toContainEqual({
      content: 'https://example.com/test',
      property: 'og:url',
    })
  })

  it('should create Twitter Card meta tags', () => {
    const result = createPageSEO({
      description: 'Test description',
      title: 'Test Page',
      url: 'https://example.com/test',
    })

    expect(result).toContainEqual({
      content: 'summary_large_image',
      name: 'twitter:card',
    })
    expect(result).toContainEqual({
      content: 'Test Page',
      name: 'twitter:title',
    })
    expect(result).toContainEqual({
      content: 'Test description',
      name: 'twitter:description',
    })
  })

  it('should include keywords when provided', () => {
    const result = createPageSEO({
      description: 'Test description',
      keywords: 'test, keywords, example',
      title: 'Test Page',
      url: 'https://example.com/test',
    })

    expect(result).toContainEqual({
      content: 'test, keywords, example',
      name: 'keywords',
    })
  })

  it('should use custom robots value when provided', () => {
    const result = createPageSEO({
      description: 'Test description',
      robots: 'noindex, nofollow',
      title: 'Test Page',
      url: 'https://example.com/test',
    })

    expect(result).toContainEqual({
      content: 'noindex, nofollow',
      name: 'robots',
    })
  })

  it('should use custom ogType when provided', () => {
    const result = createPageSEO({
      description: 'Test description',
      ogType: 'article',
      title: 'Test Article',
      url: 'https://example.com/article',
    })

    expect(result).toContainEqual({
      content: 'article',
      property: 'og:type',
    })
  })

  it('should include ogImage when provided', () => {
    const result = createPageSEO({
      description: 'Test description',
      ogImage: 'https://example.com/image.jpg',
      title: 'Test Page',
      url: 'https://example.com/test',
    })

    expect(result).toContainEqual({
      content: 'https://example.com/image.jpg',
      property: 'og:image',
    })
  })

  it('should use custom twitterCard type when provided', () => {
    const result = createPageSEO({
      description: 'Test description',
      title: 'Test Page',
      twitterCard: 'summary',
      url: 'https://example.com/test',
    })

    expect(result).toContainEqual({
      content: 'summary',
      name: 'twitter:card',
    })
  })

  it('should include twitter image when provided', () => {
    const result = createPageSEO({
      description: 'Test description',
      title: 'Test Page',
      twitterImage: 'https://example.com/twitter-image.jpg',
      url: 'https://example.com/test',
    })

    expect(result).toContainEqual({
      content: 'https://example.com/twitter-image.jpg',
      name: 'twitter:image',
    })
  })

  it('should fallback twitter image to ogImage when twitterImage is not provided', () => {
    const result = createPageSEO({
      description: 'Test description',
      ogImage: 'https://example.com/og-image.jpg',
      title: 'Test Page',
      url: 'https://example.com/test',
    })

    expect(result).toContainEqual({
      content: 'https://example.com/og-image.jpg',
      name: 'twitter:image',
    })
  })

  it('should use separate twitter image when both ogImage and twitterImage are provided', () => {
    const result = createPageSEO({
      description: 'Test description',
      ogImage: 'https://example.com/og-image.jpg',
      title: 'Test Page',
      twitterImage: 'https://example.com/twitter-image.jpg',
      url: 'https://example.com/test',
    })

    expect(result).toContainEqual({
      content: 'https://example.com/og-image.jpg',
      property: 'og:image',
    })
    expect(result).toContainEqual({
      content: 'https://example.com/twitter-image.jpg',
      name: 'twitter:image',
    })
  })

  it('should create complete meta tags with all options', () => {
    const result = createPageSEO({
      description: 'Complete test description',
      keywords: 'complete, test, all, options',
      ogImage: 'https://example.com/og-image.jpg',
      ogType: 'article',
      robots: 'index, follow, max-image-preview:large',
      title: 'Complete Test Page',
      twitterCard: 'summary_large_image',
      twitterImage: 'https://example.com/twitter-image.jpg',
      url: 'https://example.com/complete',
    })

    // Basic meta
    expect(result).toContainEqual({
      title: 'Complete Test Page | Vedneměsíčník',
    })
    expect(result).toContainEqual({
      content: 'Complete test description',
      name: 'description',
    })
    expect(result).toContainEqual({
      content: 'complete, test, all, options',
      name: 'keywords',
    })
    expect(result).toContainEqual({
      content: 'index, follow, max-image-preview:large',
      name: 'robots',
    })

    // Open Graph
    expect(result).toContainEqual({
      content: 'Complete Test Page',
      property: 'og:title',
    })
    expect(result).toContainEqual({
      content: 'article',
      property: 'og:type',
    })
    expect(result).toContainEqual({
      content: 'https://example.com/og-image.jpg',
      property: 'og:image',
    })

    // Twitter
    expect(result).toContainEqual({
      content: 'summary_large_image',
      name: 'twitter:card',
    })
    expect(result).toContainEqual({
      content: 'https://example.com/twitter-image.jpg',
      name: 'twitter:image',
    })
  })
})
