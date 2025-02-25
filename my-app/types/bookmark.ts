export interface Bookmark {
  id: string
  url: string
  title: string
  description?: string
  favicon?: string
  addedAt: number
  tags?: string[]
  folderId?: string
  createdAt: number
}

export interface BookmarkFolder {
  id: string
  name: string
  parentId?: string
  createdAt: number
}

export interface UserBookmarkData {
  bookmarks: Record<string, Bookmark>
  folders: Record<string, BookmarkFolder>
  lastUpdated: number
}

export type BrowserType = 'chrome' | 'firefox' | 'edge' | 'safari' 