import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/', 
        '/dashboard/',
        '/collections/',
        '/(auth)/',
        '/bookmarks/'
      ],
    },
    sitemap: 'https://www.bookmarkmind.top/sitemap.xml',
  }
} 