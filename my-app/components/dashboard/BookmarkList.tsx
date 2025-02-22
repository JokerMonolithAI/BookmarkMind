'use client'

import { Card } from '@/components/ui/card'

type Bookmark = {
  id: string
  title: string
  url: string
  favicon: string
  createdAt: string
  tags: string[]
}

export function BookmarkList() {
  // 这里应该从API获取书签数据
  const bookmarks: Bookmark[] = [
    {
      id: '1',
      title: 'Next.js Documentation',
      url: 'https://nextjs.org/docs',
      favicon: 'https://nextjs.org/favicon.ico',
      createdAt: '2024-03-20',
      tags: ['开发', 'React']
    }
  ]

  return (
    <div className="space-y-4">
      {bookmarks.map((bookmark) => (
        <Card key={bookmark.id} className="p-4">
          <div className="flex items-start gap-4">
            <img 
              src={bookmark.favicon} 
              alt="" 
              className="h-6 w-6"
            />
            <div className="flex-1">
              <a 
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-medium hover:underline"
              >
                {bookmark.title}
              </a>
              <p className="mt-1 text-sm text-gray-500">{bookmark.url}</p>
              <div className="mt-2 flex gap-2">
                {bookmark.tags.map((tag) => (
                  <span 
                    key={tag}
                    className="rounded-full bg-gray-100 px-2 py-1 text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
} 